# Monad Trading Bot

# 1. Sistem güncellemesi
```python
sudo apt update && sudo apt upgrade -y
```

# 2. NodeJS kurulumu
```python
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

# 3. Bot kurulumu
```python
git clone https://github.com/omercanyenigun/monadbot.git
cd monadbot
npm install
```

# 4. .env dosyası oluşturma
```python
cat > .env << EOL
PRIVATE_KEY_1=0x...key1...
PRIVATE_KEY_2=0x...key2...
PRIVATE_KEY_3=0x...key3...
PRIVATE_KEY_4=0x...key4...
PRIVATE_KEY_5=0x...key5...
PRIVATE_KEY_6=0x...key6...
EOL
```
```python
screen -S monadbot
```
```python
node monad.js
```





