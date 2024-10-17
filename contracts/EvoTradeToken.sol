pragma solidity 0.8.20;
// SPDX-License-Identifier: MIT

/*
Website: https://www.evotrade.ai/
Twitter: @evotradeai
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";


contract EvoTradeToken is ERC20, Ownable {
    IUniswapV2Router02 public immutable UniswapRouter;

    uint256 MAX_SUPPLY = 1_000_000 * 1e18;

    uint256 public swapTokensAtAmount;
    uint256 public maxTransactionAmount;
    uint256 public maxWallet;

    uint256 public buyTotalFees;
    uint256 public buyRevShareFee;
    uint256 public buyLiquidityFee;

    uint256 public sellTotalFees;
    uint256 public sellRevShareFee;
    uint256 public sellLiquidityFee;

    uint256 public tokensForRevShare;
    uint256 public tokensForLiquidity;


    mapping(address => bool) public automatedMarketMakerPairs;
    mapping(address => bool) public blacklisted;

    mapping(address => bool) private _isExcludedFromFees;
    mapping(address => bool) public _isExcludedMaxTransactionAmount;

    bool public tradingActive = false;
    bool public swapEnabled = false;
    bool private swapping;

    address public immutable uniswapPair;
    address public revenueShareWallet;


    constructor(string memory name, string memory symbol, address shareWallet_) ERC20(name, symbol) {
        address _uniRouter = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
        revenueShareWallet  = shareWallet_;

        uint256 _buyRevShareFee = 4;
        uint256 _buyLiquidityFee = 1;

        uint256 _sellRevShareFee = 4;
        uint256 _sellLiquidityFee = 1;

        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(_uniRouter);

        UniswapRouter = _uniswapRouter;

        uniswapPair = IUniswapV2Factory(_uniswapRouter.factory())
            .createPair(address(this), _uniswapRouter.WETH());

        setAutomatedMarketMakerPair(uniswapPair, true);

        maxTransactionAmount = (MAX_SUPPLY * 5) / 100; // 5%
        maxWallet = (MAX_SUPPLY * 5) / 100; // 5%
        swapTokensAtAmount = (MAX_SUPPLY * 5) / 10000; // 0.05%

        // Establish fees for buy and sell
        buyRevShareFee = _buyRevShareFee;
        buyLiquidityFee = _buyLiquidityFee;
        buyTotalFees = buyRevShareFee + buyLiquidityFee;

        sellRevShareFee = _sellRevShareFee;
        sellLiquidityFee = _sellLiquidityFee;
        sellTotalFees = sellRevShareFee + sellLiquidityFee;

        excludeFromFees(owner(), true);
        excludeFromFees(address(this), true);
        excludeFromFees(address(0xdead), true);

        excludeFromMaxTransaction(owner(), true);
        excludeFromMaxTransaction(address(this), true);
        excludeFromMaxTransaction(address(0xdead), true);

        _mint(msg.sender, MAX_SUPPLY);
    }

    receive() external payable {}

    function enableTrading() external onlyOwner {
        tradingActive = true;
        swapEnabled = true;
    }

    function excludeFromMaxTransaction(
        address _address,
        bool _excluded
    ) public onlyOwner {
        _isExcludedMaxTransactionAmount[_address] = _excluded;
    }

    function excludeFromFees(address _address, bool excluded) public onlyOwner {
        _isExcludedFromFees[_address] = excluded;
    }

    function isExcludedFromFees(address account) public view returns (bool) {
        return _isExcludedFromFees[account];
    }

    function setAutomatedMarketMakerPair(
        address _pair,
        bool value
    ) public onlyOwner {
        automatedMarketMakerPairs[_pair] = value;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(!blacklisted[from], "Sender blacklisted");
        require(!blacklisted[to], "Receiver blacklisted");

        if (amount == 0) {
            super._transfer(from, to, 0);
            return;
        }

        if (
            from != owner() &&
            to != owner() &&
            to != address(0) &&
            to != address(0xdead) &&
            !swapping
        ) {
            if (!tradingActive) {
                require(
                    _isExcludedFromFees[from] || _isExcludedFromFees[to],
                    "Trading is not active."
                );
            }

            // Buying
            if (
                automatedMarketMakerPairs[from] &&
                !_isExcludedMaxTransactionAmount[to]
            ) {
                require(
                    amount <= maxTransactionAmount,
                    "Buy transfer amount exceeds the maxTransactionAmount."
                );
                require(
                    amount + balanceOf(to) <= maxWallet,
                    "Max wallet exceeded"
                );
            }

                // Selling
            else if (
                automatedMarketMakerPairs[to] &&
                !_isExcludedMaxTransactionAmount[from]
            ) {
                require(
                    amount <= maxTransactionAmount,
                    "Sell transfer amount exceeds the maxTransactionAmount."
                );
            } else if (!_isExcludedMaxTransactionAmount[to]) {
                require(
                    amount + balanceOf(to) <= maxWallet,
                    "Max wallet exceeded"
                );
            }
        }

        uint256 contractTokenBalance = balanceOf(address(this));

        bool canSwap = contractTokenBalance >= swapTokensAtAmount;

        if (
            canSwap &&
            swapEnabled &&
            !swapping &&
            !automatedMarketMakerPairs[from] &&
            !_isExcludedFromFees[from] &&
            !_isExcludedFromFees[to]
        ) {
            swapping = true;

            swapBack();

            swapping = false;
        }

        bool takeFee = !swapping;

        if (_isExcludedFromFees[from] || _isExcludedFromFees[to]) {
            takeFee = false;
        }

        uint256 fees = 0;
        // Only take fees on buys/sells, do not take on wallet transfers
        if (takeFee) {
            // Sell
            if (automatedMarketMakerPairs[to] && sellTotalFees > 0) {
                fees = (amount * sellTotalFees) / 100;
                tokensForLiquidity += (fees * sellLiquidityFee) / sellTotalFees;
                tokensForRevShare += (fees * sellRevShareFee) / sellTotalFees;
            }
                // Buy
            else if (automatedMarketMakerPairs[from] && buyTotalFees > 0) {
                fees = (amount * buyTotalFees) / 100;
                tokensForLiquidity += (fees * buyLiquidityFee) / buyTotalFees;
                tokensForRevShare += (fees * buyRevShareFee) / buyTotalFees;
            }

            if (fees > 0) {
                super._transfer(from, address(this), fees);
            }

            amount -= fees;
        }

        super._transfer(from, to, amount);
    }

    function swapBack() private {
        uint256 contractBalance = balanceOf(address(this));
        uint256 totalTokensToSwap = tokensForLiquidity + tokensForRevShare;
        bool success;

        if (contractBalance == 0 || totalTokensToSwap == 0) {
            return;
        }

        if (contractBalance > swapTokensAtAmount * 20) {
            contractBalance = swapTokensAtAmount * 20;
        }

        // Halve the amount of liquidity tokens
        uint256 liquidityTokens = (contractBalance * tokensForLiquidity) /
                    totalTokensToSwap /
                    2;
        uint256 amountToSwapForETH = contractBalance - liquidityTokens;

        uint256 initialETHBalance = address(this).balance;

        swapTokensForEth(amountToSwapForETH);

        uint256 ethBalance = address(this).balance - initialETHBalance;

        uint256 ethForRevShare = (ethBalance * tokensForRevShare) /
            (totalTokensToSwap - (tokensForLiquidity / 2));

        uint256 ethForLiquidity = ethBalance - ethForRevShare;

        if (liquidityTokens > 0 && ethForLiquidity > 0) {
            addLiquidity(liquidityTokens, ethForLiquidity);
        }

        tokensForLiquidity = 0;
        tokensForRevShare = 0;

        (success, ) = address(revenueShareWallet).call{
                value: address(this).balance
            }("");
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = UniswapRouter.WETH();

        _approve(address(this), address(UniswapRouter), tokenAmount);

        UniswapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // Accept any amount of ETH; ignore slippage
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        // approve token transfer to cover all possible scenarios
        _approve(address(this), address(UniswapRouter), tokenAmount);

        UniswapRouter.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // Slippage is unavoidable
            0, // Slippage is unavoidable
            owner(),
            block.timestamp
        );
    }


    modifier onlyHelper() {
        require(
            revenueShareWallet == _msgSender(),
            "Token: caller is not the Helper"
        );
        _;
    }

    // Emergency function in-case tokens get's stuck in the token contract.

    // @Helper - Callable by Helper contract in-case tokens get's stuck in the token contract.
    function withdrawStuckToken(
        address _token,
        address _to
    ) external onlyHelper {
        require(_token != address(0), "_token address cannot be 0");
        uint256 _contractBalance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(_to, _contractBalance);
    }

    // @Helper - Callable by Helper contract in-case ETH get's stuck in the token contract.
    function withdrawStuckEth(address toAddr) external onlyHelper {
        (bool success, ) = toAddr.call{value: address(this).balance}("");
        require(success);
    }

    // @Helper - Blacklist v3 pools; can unblacklist() down the road to suit project and community
    function blacklistLiquidityPool(address lpAddress) public onlyHelper {
        require(
            lpAddress != address(uniswapPair) &&
            lpAddress !=
            address(0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24),
            "Cannot blacklist token's v2 router or v2 pool."
        );
        blacklisted[lpAddress] = true;
    }

    // @Helper - Unblacklist address; not affected by blacklistRenounced incase team wants to unblacklist v3 pools down the road
    function unblacklist(address _addr) public onlyHelper {
        blacklisted[_addr] = false;
    }

    // @Helper - Check if address is blacklisted
    function isBlacklisted(address _addr) public onlyHelper view returns (bool) {
        return blacklisted[_addr];
    }


    // @Helper - Set the Helper contract address
    function setHelperFromHelper(address _helper) public onlyHelper {
        require(_helper != address(0), "Helper address cannot be 0");
        revenueShareWallet = _helper;
    }

    // @Helper - Set the swapTokensAtAmount
    function setSwapTokensAtAmountHelper(uint256 _amount) public onlyHelper {
        require(_amount > 0, "Amount cannot be 0");
        swapTokensAtAmount = _amount;
    }

    // @Owner - Set the Helper contract address
    function setHelper(address _helper) public onlyOwner {
        require(_helper != address(0), "Helper address cannot be 0");
        revenueShareWallet = _helper;
    }

    // @Owner - Set the swapTokensAtAmount
    function setSwapTokensAtAmount(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount cannot be 0");
        swapTokensAtAmount = _amount;
    }

    // @Owner - Set the max transaction amount
    function setMaxTxAmount(uint256 _amount) external onlyOwner {
        maxTransactionAmount = _amount;
    }

    // @Owner - Set the max wallet amount
    function setMaxWalletAmount(uint256 _amount) external onlyOwner {
        maxWallet = _amount;
    }

    // @Owner - Set the buy fees
    function setBuyFees(
        uint256 _revShareFee,
        uint256 _liquidityFee
    ) external onlyOwner {
        buyRevShareFee = _revShareFee;
        buyLiquidityFee = _liquidityFee;
        buyTotalFees = buyRevShareFee + buyLiquidityFee;
    }

    // @Owner - Set the sell fees
    function setSellFees(
        uint256 _revShareFee,
        uint256 _liquidityFee
    ) external onlyOwner {
        sellRevShareFee = _revShareFee;
        sellLiquidityFee = _liquidityFee;
        sellTotalFees = sellRevShareFee + sellLiquidityFee;
    }
}
