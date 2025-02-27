const ethers = require('ethers');
require('dotenv').config();

// Chain Konfigürasyonu
const CHAIN = {
    id: 10143,
    name: "Monad Testnet",
    rpcs: [
        "https://testnet-rpc.monad.xyz/",
        "https://monad-testnet.g.alchemy.com/v2/Bz53R41828QsmK844O1akHBt46uVJLXF"
    ]
};

// Cüzdanlar
const WALLETS = [
    {
        name: "Wallet 1",
        privateKey: process.env.PRIVATE_KEY_1,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now()
    },
    {
        name: "Wallet 2",
        privateKey: process.env.PRIVATE_KEY_2,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now() + 100000
    },
    {
        name: "Wallet 3",
        privateKey: process.env.PRIVATE_KEY_3,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now() + 200000
    },
    {
        name: "Wallet 4",
        privateKey: process.env.PRIVATE_KEY_4,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now() + 300000
    },
    {
        name: "Wallet 5",
        privateKey: process.env.PRIVATE_KEY_5,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now() + 400000
    },
    {
        name: "Wallet 6",
        privateKey: process.env.PRIVATE_KEY_6,
        lastTradeTime: 0,
        tradesThisInterval: 0,
        intervalStartTime: Date.now(),
        nextTradeTime: Date.now() + 500000
    }
];

// Havuzlar
const POOLS = {
    "WMON-CHOG": {
        address: "0xc0ce32EEe0eb8bF24FA2b00923a78abc5002f91e",
        tokens: ["WMON", "CHOG"]
    },
    "WMON-USDT": {
        address: "0xfBC2D240A5eD44231AcA3A9e9066bc4b33f01149",
        tokens: ["WMON", "USDT"]
    },
    "WMON-YAKI": {
        address: "0x212fde77a42d55f980d0a0304e7eebe1e999c60f",
        tokens: ["WMON", "YAKI"]
    },
    "WMON-DAK": {
        address: "0x6e4b7be5ef7f8950c76baa0bd90125bc9b33c8db",
        tokens: ["WMON", "DAK"]
    }
};

// Token Konfigürasyonları
const TOKENS = {
    WMON: {
        symbol: 'WMON',
        address: "0x760afe86e5de5fa0ee542fc7b7b713e1c5425701",
        decimals: 18
    },
    USDT: {
        symbol: 'USDT',
        address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
        decimals: 6
    },
    CHOG: {
        symbol: 'CHOG',
        address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b",
        decimals: 18
    },
    DAK: {
        symbol: 'DAK',
        address: "0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714",
        decimals: 18
    },
    YAKI: {
        symbol: 'YAKI',
        address: "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50",
        decimals: 18
    },
    USDC: {
        symbol: 'USDC',
        address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
        decimals: 6  // USDC genellikle 6 decimal kullanır
    }
};

// Router ve ABI'ler
const ROUTER = {
    address: "0xfb8e1c3b833f9e67a71c859a132cf783b645e436",
    abi: [
        "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    ]
};

// ERC20 ABI güncelleme
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

// Alternatif RPC'leri ekleyelim
const RPC_URLS = [
    "https://testnet-rpc.monad.xyz/",
    "https://monad-testnet.g.alchemy.com/v2/Bz53R41828QsmK844O1akHBt46uVJLXF"
];

// RPC değiştirme fonksiyonu
let currentRpcIndex = 0;
function getNextRpc() {
    currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
    return RPC_URLS[currentRpcIndex];
}

// RPC çağrısı için gelişmiş retry fonksiyonu
async function retryRpcCall(callback, retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await callback();
        } catch (error) {
            if (i === retries - 1) throw error;
            
            // RPC hatası durumunda
            if (error.code === 'UNKNOWN_ERROR' || 
                error.message.includes('failed to serve request') ||
                error.message.includes('could not coalesce error')) {
                
                console.log(`\n🔄 RPC değiştiriliyor...`);
                
                // RPC'yi değiştir
                CHAIN.rpcs = [getNextRpc()];
                
                // Biraz bekle ve tekrar dene
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            throw error;
        }
    }
}

// Bakiye kontrol fonksiyonunu güncelleyelim
async function checkBalance(wallet, token) {
    return retryRpcCall(async () => {
        const provider = new ethers.JsonRpcProvider(CHAIN.rpcs[0]);
        const signer = new ethers.Wallet(wallet.privateKey, provider);
        const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
        const balance = await contract.balanceOf(signer.address);
        return ethers.formatUnits(balance, token.decimals);
    });
}

// RPC bekleme fonksiyonunu güncelleyelim
async function waitForReceipt(provider, txHash, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt) return receipt;
        } catch (error) {
            console.log(`RPC denemesi ${i + 1}/${retries} başarısız, tekrar deneniyor... ⏳`);
        }
        // 5 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    return null;
}

// Random miktar fonksiyonunu güncelleyelim
function getRandomAmount(min, max, tokenSymbol) {
    let amount;
    // Token türüne göre miktar aralığı
    if (['YAKI', 'CHOG', 'DAK'].includes(tokenSymbol)) {
        amount = 10 + (Math.random() * (20 - 10)); // 10-20 arası
    } else if (['USDT', 'USDC'].includes(tokenSymbol)) {
        amount = 2 + (Math.random() * (5 - 2)); // 2-5 arası
    } else if (tokenSymbol === 'WMON') {
        amount = 0.05 + (Math.random() * (0.1 - 0.05)); // WMON için 0.05-0.1 arası
    } else {
        amount = min + (Math.random() * (max - min)); // varsayılan aralık
    }
    
    // Miktarı 2 ondalık basamağa yuvarla
    return Number(amount.toFixed(2));
}

// Trading fonksiyonunu güncelleyelim
async function runTrading(wallet) {
    try {
        const wmonBalance = await checkBalance(wallet, TOKENS.WMON);
        const tokenSymbols = Object.keys(TOKENS).filter(symbol => symbol !== 'WMON');
        const randomToken = TOKENS[tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)]];
        const tokenBalance = await checkBalance(wallet, randomToken);
        
        const doTokenToWMON = Math.random() < 0.5;
        
        if (doTokenToWMON) {
            const tradeAmount = getRandomAmount(0, 0, randomToken.symbol);
            if (parseFloat(tokenBalance) >= tradeAmount) {
                await performSwap(wallet, randomToken, TOKENS.WMON, tradeAmount);
            } else {
                const wmonAmount = getRandomAmount(0, 0, 'WMON');
                if (parseFloat(wmonBalance) >= wmonAmount) {
                    await performSwap(wallet, TOKENS.WMON, randomToken, wmonAmount);
                }
            }
        } else {
            const wmonAmount = getRandomAmount(0, 0, 'WMON');
            if (parseFloat(wmonBalance) >= wmonAmount) {
                await performSwap(wallet, TOKENS.WMON, randomToken, wmonAmount);
            } else {
                const tradeAmount = getRandomAmount(0, 0, randomToken.symbol);
                if (parseFloat(tokenBalance) >= tradeAmount) {
                    await performSwap(wallet, randomToken, TOKENS.WMON, tradeAmount);
                }
            }
        }
        
    } catch (error) {
        console.error(`Trading hatası: ${error.message} ❌`);
    }
}

// Yardımcı fonksiyon: Array'i karıştır
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// performSwap fonksiyonunu güncelleyelim
async function performSwap(wallet, tokenIn, tokenOut, amount) {
    try {
        const provider = new ethers.JsonRpcProvider(CHAIN.rpcs[0]);
        const signer = new ethers.Wallet(wallet.privateKey, provider);
        
        const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const routerContract = new ethers.Contract(ROUTER.address, ROUTER.abi, signer);
        
        const amountIn = ethers.parseUnits(amount.toString(), tokenIn.decimals);
        
        // Başlık ve diğer bilgiler (2 boş satır ile)
        console.log(`\n\n=== ${wallet.name} İşlem Kontrolü ===`);
        console.log(`${wallet.name} ${tokenIn.symbol} bakiyesi: ${await checkBalance(wallet, tokenIn)} ${tokenIn.symbol} 💰`);
        console.log(`${wallet.name} ${tokenOut.symbol} bakiyesi: ${await checkBalance(wallet, tokenOut)} ${tokenOut.symbol}`);
        console.log(`${wallet.name}: ${tokenIn.symbol} -> ${tokenOut.symbol} işlemi yapılıyor`);
        console.log(`${wallet.name}: ${tokenIn.symbol} -> ${tokenOut.symbol} swap başlıyor...`);
        console.log(`Miktar: ${amount} ${tokenIn.symbol}`);
        
        try {
            const path = [tokenIn.address, tokenOut.address];
            console.log("Swap path: [");
            console.log(`  '${path[0]}',`);
            console.log(`  '${path[1]}'`);
            console.log("]");
            
            const amounts = await routerContract.getAmountsOut(amountIn, path);
            const minOut = amounts[1] * 95n / 100n; // %5 slippage

            const allowance = await tokenContract.allowance(signer.address, ROUTER.address);
            if (allowance < amountIn) {
                const approveTx = await tokenContract.approve(ROUTER.address, ethers.MaxUint256);
                await waitForReceipt(provider, approveTx.hash);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            const deadline = Math.floor(Date.now() / 1000) + 1200;
            
            const tx = await routerContract.swapExactTokensForTokens(
                amountIn,
                minOut,
                path,
                signer.address,
                deadline,
                { 
                    gasLimit: 400000,
                    gasPrice: ethers.parseUnits("52", "gwei")
                }
            );
            
            console.log(`${wallet.name}: İşlem gönderildi, bekleniyor... (${tx.hash}) 🔄`);
            
            const receipt = await waitForReceipt(provider, tx.hash);
            if (receipt) {
                console.log(`${wallet.name}: Swap başarılı! Gas kullanımı: ${receipt.gasUsed} ✅`);
                console.log(`⏳ ${Math.floor(Math.random() * (25 - 15) + 15)} saniye sonra devam edilecek...`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`${wallet.name}: İşlem hatası: ${error.message} ❌`);
            return false;
        }
    } catch (error) {
        console.error(`${wallet.name}: İşlem hatası: ${error.message} ❌`);
        return false;
    }
}

// Ana döngüyü güncelleyelim
async function main() {
    console.log("Bot başlatılıyor...");
    
    // Wallet adreslerini göster
    for (const wallet of WALLETS) {
        const signer = new ethers.Wallet(wallet.privateKey);
        console.log(`${wallet.name} adresi: ${signer.address}`);
    }
    
    let currentInterval = Math.floor(Date.now() / 600000);
    let walletQueue = [];
    let completedTrades = 0;
    
    // İlk periyot için cüzdan sırasını oluştur
    for (let i = 0; i < WALLETS.length; i++) {
        for (let j = 0; j < 3; j++) {
            walletQueue.push(i);
        }
    }
    walletQueue = shuffleArray(walletQueue);
    
    while (true) {
        try {
            const now = Date.now();
            const newInterval = Math.floor(now / 600000);
            
            if (newInterval !== currentInterval) {
                currentInterval = newInterval;
                WALLETS.forEach(wallet => {
                    wallet.tradesThisInterval = 0;
                    wallet.intervalStartTime = now;
                });
                walletQueue = [];
                for (let i = 0; i < WALLETS.length; i++) {
                    for (let j = 0; j < 3; j++) {
                        walletQueue.push(i);
                    }
                }
                walletQueue = shuffleArray(walletQueue);
            }
            
            if (walletQueue.length > 0) {
                const walletIndex = walletQueue[0];
                const wallet = WALLETS[walletIndex];
                await runTrading(wallet);
                walletQueue.shift();
                
                completedTrades++;
                // Sadece 18 işlem tamamlandığında mesaj göster
                if (completedTrades === 18) {
                    console.log(`🎯 ${completedTrades} işlem tamamlandı!`);
                }
                
                const waitTime = 15000 + Math.floor(Math.random() * 15000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            const timeUntilNextInterval = (currentInterval + 1) * 600000 - now;
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error("Ana döngü hatası:", error.message);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
}

// Botu başlat
main().catch(console.error);