import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionsContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionsContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionsContract;
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.transactionCount
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: e.target.value,
    }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert("please install metamask!");
      }

      const transactionContract = getEthereumContract();

      const availableTransactions =
        await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );

      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkWalletConnected = async () => {
    try {
      if (!ethereum) {
        return alert("please install metamask!");
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("no account found");
      }
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  const checkIftransactionExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionsCount();
      localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert("please install metamask!");
      }

      //get data from form

      const { addressTo, amount, keyword, message } = formData;

      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208",
            value: parsedAmount._hex,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      setIsLoading(false);

      const transactionCount = await transactionContract.getTransactionsCount();

      setTransactionCount(transactionCount.toNumber());
      window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  useEffect(() => {
    checkWalletConnected();
    checkIftransactionExist();
  }, []);

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert("please install metamask!");
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log(accounts);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  return (
    <TransactionsContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        transactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
