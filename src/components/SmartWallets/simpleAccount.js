import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Client, Presets } from "userop";
import Modal from "react-modal";

Modal.setAppElement("#root"); // This line is required for accessibility reasons

function SimpleAccount({ signerAddress }) {
  const [simpleAccountAddress, setSimpleAccountAddress] = useState(null);
  const [simpleAccount, setSimpleAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState(null);
  const [client, setClient] = useState(null);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [userOpHash, setUserOpHash] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    const initializeSimpleAccount = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const signer = provider.getSigner(signerAddress);

        const _simpleAccount = await Presets.Builder.SimpleAccount.init(
          signer,
          process.env.REACT_APP_RPC_URL,
          process.env.REACT_APP_ENTRY_POINT,
          process.env.REACT_APP_SIMPLE_ACCOUNT_FACTORY
        );

        if (_simpleAccount) {
          setSimpleAccount(_simpleAccount);
          setSimpleAccountAddress(_simpleAccount.getSender());
          const client = await Client.init(
            process.env.REACT_APP_RPC_URL,
            process.env.REACT_APP_ENTRY_POINT
          );
          setClient(client);

          // Get account balance
          const balance = await provider.getBalance(_simpleAccount.getSender());
          setBalance(ethers.utils.formatEther(balance));
        } else {
          console.error("simpleAccount or simpleAccount.address is undefined");
        }
      }
    };

    if (signerAddress) {
      initializeSimpleAccount();
    }
  }, [signerAddress]);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleTransfer = async () => {
    const value = ethers.utils.parseEther(amount.toString()); // Convert to wei

    const res = await client.sendUserOperation(
      simpleAccount.execute(recipient, value, "0x"),
      { onBuild: (op) => console.log("Signed UserOperation:", op) }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);
    setUserOpHash(res.userOpHash);

    console.log("Waiting for transaction...");
    setTransactionHash("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    setTransactionHash(ev?.transactionHash ?? null);

    // Update balance
    const balance = await provider.getBalance(simpleAccountAddress);
    setBalance(ethers.utils.formatEther(balance));

    closeModal();
  };

  return (
    <div>
      {simpleAccountAddress ? (
        <>
          <p>Simple Account Address: {simpleAccountAddress}</p>
          <p>Balance: {balance} ETH</p>
          <button onClick={openModal}>Transfer</button>
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Transfer Modal"
          >
            <h2>Transfer</h2>
            <input
              type="text"
              placeholder="Recipient"
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleTransfer}>Confirm Transfer</button>
            <button onClick={closeModal}>Close</button>
            <div>
              <p>UserOpHash: {userOpHash}</p>
              <p>Transaction Hash: {transactionHash}</p>
            </div>
          </Modal>
        </>
      ) : (
        <p>Connect wallet to view Simple Account Address</p>
      )}
    </div>
  );
}

export default SimpleAccount;
