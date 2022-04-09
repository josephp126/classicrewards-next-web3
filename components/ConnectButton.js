import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import { Button } from "@chakra-ui/react";
import ClassicRewards from "../abi/classicRwards.json";

// import { contractAddress } from "../config/contractAddress";
// import { contractABI } from "../config/abi";

export function ConnectButton({ setContract }) {
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);
  const [address, setAddress] = useState(null);
  const [mainC, setMainC] = useState(null);
  let web3Modal;
  const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
    ? Number(process.env.NEXT_PUBLIC_CHAIN_ID)
    : 56;

  useEffect(() => {
    listenToProviderEvents();

    async function listenToProviderEvents() {
      if (provider) {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
        provider.on("disconnect", handleDisconnect);

        return () => {
          if (provider.removeListener) {
            provider.removeListener("accountsChanged", handleAccountsChanged);
            provider.removeListener("chainChanged", handleChainChanged);
            provider.removeListener("disconnect", handleDisconnect);
          }
        };

        function handleAccountsChanged(accounts) {
          setAddress(accounts[0]);
        }

        function handleChainChanged() {
          debugger;
          // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
          window.location.reload();
        }

        function handleDisconnect() {
          resetConnection();
        }
      }
    }
  }, []);

  if (typeof window !== "undefined") {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            4: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // rinkeby  testnet
            56: "https://bsc-dataseed.binance.org/", // binance mainnet
            97: "https://data-seed-prebsc-1-s1.binance.org:8545", // binance testnet
          },
        },
      },
    };
    web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
      providerOptions,
    });
  }

  return network?.chainId === CHAIN_ID && address ? (
    <Button
      onClick={resetConnection}
      align="center"
      color="#C66CFF"
      border="1px solid #C66CFF"
      backgroundColor="#0B3552"
      w="175px"
      h="50px"
    >
      BNB DISCONNECT
    </Button>
  ) : (
    <Button
      onClick={connectWallet}
      align="center"
      color="#C66CFF"
      border="1px solid #C66CFF"
      backgroundColor="#0B3552"
      w="150px"
      h="50px"
    >
      BNB CONNECT
    </Button>
  );

  async function connectWallet() {
    try {
      const instance = await web3Modal.connect();
      await instance.enable();

      setProvider(instance);
      const _provider = new ethers.providers.Web3Provider(instance);

      const signer = _provider.getSigner();

      const address = await signer.getAddress();
      setAddress(address);
      console.log(address);
      const network = await _provider.getNetwork();
      setNetwork(network);
      console.log(network);

      if (network.chainId !== CHAIN_ID) {
        alert("Please, change to Binance network");
        return;
      }

      await getContracts();

      async function getContracts() {
        const _contract = new ethers.Contract(
          ClassicRewards.address,
          ClassicRewards.abi,
          signer
        );
        setContract(_contract);
        setMainC(_contract);
      }
      await setContracts(signer);
    } catch (error) {
      if (
        error.message === "User closed modal" ||
        error.message === "User Rejected"
      ) {
        console.log(error.message);
      } else {
        console.error(error);
      }
    }
  }

  async function resetConnection() {
    console.log("disconnecting from provider", address, provider, network);
    // debugger;

    await web3Modal.clearCachedProvider();
    if (provider?.disconnect && typeof provider.disconnect === "function") {
      console.log("disconnecting from provider");
      await provider.disconnect();
    }
    localStorage.clear();

    setAddress([""]);
    setProvider(null);
    setContract(null);
    setNetwork({});
    await web3Modal.off();

    console.log("disconnected");
  }

  async function setContracts(signer) {
    if(mainC && Number(await mainC.totalSupply()) >= 150) {
      const _contract = new ethers.Contract(
        ClassicRewards.subAddress,
        ClassicRewards.abi,
        signer
      );
      setContract(_contract);
    }
  }
}
