"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import PriceDisplay, { PriceTicker } from "~~/components/PriceDisplay";
import { WalletConnection } from "~~/components/WalletConnection";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { usePricing } from "~~/hooks/usePricing";
import { useUserData } from "~~/hooks/useUserData";
import { useWalletUser } from "~~/hooks/useWalletUser";

const PayWithTapNgo = () => {
  const router = useRouter();
  const { transactions, loading: userDataLoading } = useUserData();
  const { walletAddress, isWalletLinked } = useWalletUser();
  const { convertUsdcToGhs, formatGhsPrice } = usePricing();

  // Mock USDC balance - replace with actual contract call when bUSDC is deployed
  const mockUsdcBalance = 1000000; // 1 USDC in wei (6 decimals)

  if (userDataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const paymentOptions = [
    {
      icon: "qr",
      title: "Scan QR Code",
      description: "Scan merchant's QR to pay",
      color: "bg-blue-500",
      onClick: () => router.push("/payment"),
    },
    {
      icon: "tap",
      title: "Tap to Pay",
      description: "Hold near merchant's device",
      color: "bg-purple-500",
      onClick: () => router.push("/accept-payment"),
    },
    {
      icon: "send",
      title: "Send Money",
      description: "Send to friends or vendors",
      color: "bg-orange-500",
      onClick: () => router.push("/send-money"),
    },
    {
      icon: "receive",
      title: "Receive Money",
      description: "Get paid via QR or NFC",
      color: "bg-green-500",
      onClick: () => router.push("/receive-money"),
    },
    {
      icon: "ens",
      title: "Send to ENS",
      description: "Send to username.tapngo.eth",
      color: "bg-indigo-500",
      onClick: () => router.push("/send-to-ens"),
    },
    {
      icon: "demo",
      title: "Get Demo Funds",
      description: "Try the app with test USDC",
      color: "bg-emerald-500",
      onClick: () => router.push("/faucet"),
    },
    {
      icon: "setup",
      title: "Setup ENS",
      description: "Claim your .tapngo.eth subname",
      color: "bg-indigo-500",
      onClick: () => router.push("/ens-setup"),
    },
    {
      icon: "profile",
      title: "Profile",
      description: "Manage your account settings",
      color: "bg-gray-500",
      onClick: () => router.push("/profile"),
    },
    {
      icon: "vendor",
      title: "Become Vendor",
      description: "Register your business",
      color: "bg-purple-500",
      onClick: () => router.push("/vendor-registration"),
    },
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "qr":
        return (
          <div className="w-8 h-8 bg-blue-300 rounded grid grid-cols-2 gap-1">
            <div className="bg-blue-400 rounded-sm"></div>
            <div className="bg-blue-500 rounded-sm"></div>
            <div className="bg-blue-500 rounded-sm"></div>
            <div className="bg-blue-400 rounded-sm"></div>
          </div>
        );
      case "tap":
        return <span className="text-white text-lg font-bold">H</span>;
      case "demo":
        return <span className="text-white text-lg font-bold">+</span>;
      case "send":
        return <span className="text-white text-lg">✉</span>;
      case "receive":
        return <span className="text-white text-lg">↓</span>;
      case "ens":
        return <span className="text-white text-lg">��</span>;
      case "setup":
        return <span className="text-white text-lg">⚙</span>;
      case "profile":
        return <span className="text-white text-lg">��</span>;
      case "vendor":
        return <span className="text-white text-lg">🏪</span>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile and Tablet Layout (sm and md screens) */}
      <div className="lg:hidden min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pay with Tap&Go</h1>
          <p className="text-gray-600 text-sm">Fast, secure stablecoin payments</p>
          <div className="mt-4">
            <PriceTicker />
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Payment Options */}
          {paymentOptions.map((option, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={option.onClick}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}>
                  {getIcon(option.icon)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                </div>
                <ChevronRightIcon width={20} height={20} className="text-gray-400" />
              </div>
            </div>
          ))}

          {/* Balance Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Your Balance</p>
                <PriceDisplay ghsAmount={convertUsdcToGhs(mockUsdcBalance / 1e6)} showRate={false} size="lg" />
              </div>
              <button className="bg-blue-600 text-white font-medium py-3 px-6 rounded-xl text-sm hover:bg-blue-700 transition-colors">
                Add Funds
              </button>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Wallet Connection</h3>
            <WalletConnection />
            {!isWalletLinked && (
              <p className="text-sm text-gray-500 mt-2">Connect and link your wallet to access Web3 features</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 3).map(transaction => (
                  <div key={transaction.id} className="flex items-center space-x-4 py-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">
                        {transaction.vendorEns ? transaction.vendorEns.charAt(0).toUpperCase() : "T"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.vendorEns || "Transaction"}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">-₵{transaction.amountGHS.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">-{transaction.amountUSDC.toFixed(2)} USDC</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start making payments to see your history</p>
                </div>
              )}
            </div>

            {transactions.length > 0 && (
              <button
                onClick={() => router.push("/transaction-history")}
                className="w-full text-blue-600 font-medium py-2 mt-4 hover:text-blue-700 transition-colors"
              >
                View All Transactions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout (lg screens and above) */}
      <div className="hidden lg:block min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Pay with Tap&Go</h1>
            <p className="text-gray-600 text-xl">Fast, secure stablecoin payments</p>
            <div className="mt-6">
              <PriceTicker />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Payment Options */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paymentOptions.map((option, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={option.onClick}
                    >
                      <div className="flex items-center space-x-6">
                        <div className={`w-16 h-16 ${option.color} rounded-2xl flex items-center justify-center`}>
                          {getIcon(option.icon)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                          <p className="text-gray-600">{option.description}</p>
                        </div>
                        <ChevronRightIcon width={24} height={24} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-3xl p-8 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Stats</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">₵2.4M</div>
                      <div className="text-sm text-gray-600">Total Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">1,247</div>
                      <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">99.9%</div>
                      <div className="text-sm text-gray-600">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Balance and Recent Activity */}
              <div className="space-y-6">
                {/* Balance Card */}
                <div className="bg-white rounded-3xl p-8 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Balance</h3>
                  <div className="text-center mb-6">
                    <PriceDisplay
                      ghsAmount={convertUsdcToGhs(mockUsdcBalance / 1e6)}
                      showRate={true}
                      size="lg"
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
                      Add Funds
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors">
                      Withdraw
                    </button>
                  </div>
                </div>

                {/* Wallet Connection */}
                <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Wallet Connection</h3>
                  <WalletConnection />
                  {!isWalletLinked && (
                    <p className="text-sm text-gray-500 mt-2">Connect and link your wallet to access Web3 features</p>
                  )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-3xl p-8 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 3).map(transaction => (
                        <div key={transaction.id} className="flex items-center space-x-4 py-2">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-bold">
                              {transaction.vendorEns ? transaction.vendorEns.charAt(0).toUpperCase() : "T"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{transaction.vendorEns || "Transaction"}</p>
                            <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">-₵{transaction.amountGHS.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">-{transaction.amountUSDC.toFixed(2)} USDC</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No transactions yet</p>
                        <p className="text-sm text-gray-400 mt-1">Start making payments to see your history</p>
                      </div>
                    )}
                  </div>

                  {transactions.length > 0 && (
                    <button
                      onClick={() => router.push("/transaction-history")}
                      className="w-full text-blue-600 font-medium py-2 mt-4 hover:text-blue-700 transition-colors"
                    >
                      View All Transactions
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayWithTapNgo;
