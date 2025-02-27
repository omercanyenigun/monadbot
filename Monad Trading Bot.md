## 1. Sistem güncellemesi
```python
sudo apt update && sudo apt upgrade -y
```
## 2. NodeJS kurulumu
```python
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
## 3. Bot kurulumu
```python
git clone https://github.com/omercanyenigun/monadbot.git
cd monadbot
```
## 4. package.json oluştur
```python
cat > package.json << EOL
{
  "name": "monadbot",
  "version": "1.0.0",
  "main": "monad.js",
  "scripts": {
    "start": "node monad.js"
  },
  "dependencies": {
    "dotenv": "^16.4.7",
    "ethers": "^6.13.5"
  }
}
EOL
```
## 5. .env dosyası oluşturma
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
npm install
```
```python
screen -S monadbot
```
```python
node monad.js
```





