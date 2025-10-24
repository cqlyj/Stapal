-include .env

install:
	@forge install OpenZeppelin/openzeppelin-contracts 

deploy-mock-pyusd:
	@forge script script/DeployMockPYUSD.s.sol:DeployMockPYUSD --rpc-url ${ARBITRUM_SEPOLIA_RPC_URL} --account burner --sender 0x120C1fc5B7f357c0254cDC8027970DDD6405e115 --broadcast --verify --verifier blockscout --verifier-url https://arbitrum-sepolia.blockscout.com/api/ -vvvv

deploy-stapal:
	@forge script script/DeployStapal.s.sol:DeployStapal --rpc-url ${ARBITRUM_SEPOLIA_RPC_URL} --account burner --sender 0x120C1fc5B7f357c0254cDC8027970DDD6405e115 --broadcast --verify --verifier blockscout --verifier-url https://arbitrum-sepolia.blockscout.com/api/ -vvvv