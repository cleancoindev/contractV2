const fs = require("fs");
const file = fs.createWriteStream("../deploy-detail-v1.5.txt", { 'flags': 'a' });
let logger = new console.Console(file, file);

const DODOApprove = artifacts.require("DODOApprove");
const DODOProxyV1 = artifacts.require("DODOV1Proxy01");
const DODOSellHelper = artifacts.require("DODOSellHelper");
const DODOSwapCalcHelper = artifacts.require("DODOSwapCalcHelper");

const DEPLOY_ROUTE = false;

module.exports = async (deployer, network, accounts) => {
  let DODOSellHelperAddress = "";
  let WETHAddress = "";
  let DODOApproveAddress = "";
  let chiAddress = "";
  let DODOSwapCalcHelperAddress = "";
  let ownerAddress = ""
  if (network == "kovan") {
    DODOSellHelperAddress = "0xbdEae617F2616b45DCB69B287D52940a76035Fe3";
    WETHAddress = "0x5eca15b12d959dfcf9c71c59f8b467eb8c6efd0b";
    DODOSwapCalcHelperAddress = "0x0473FFd7039435F1FC794281F2a05830A1a0108a";
    DODOApproveAddress = "";
    chiAddress = "0x0000000000004946c0e9f43f4dee607b0ef1fa1c";
    ownerAddress = accounts[0];
  } else if (network == "live") {
    DODOSellHelperAddress = "0x533da777aedce766ceae696bf90f8541a4ba80eb";
    WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    DODOApproveAddress = "0xCB859eA579b28e02B87A1FDE08d087ab9dbE5149";
    chiAddress = "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c";
    DODOSwapCalcHelperAddress = "0x3C02477f1B3C70D692be95a6e3805E02bba71206";
    ownerAddress = "0x95C4F5b83aA70810D4f142d58e5F7242Bd891CB0";
  } else if (network == "bsclive") {
    DODOSellHelperAddress = "0x0F859706AeE7FcF61D5A8939E8CB9dBB6c1EDA33";
    WETHAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    DODOApproveAddress = "";
    chiAddress = "0x0000000000000000000000000000000000000000";
    DODOSwapCalcHelperAddress = "0xb0199C2c8ADF1E6c1e41De60A62E993406Cb8C02";
    //TODO:待生成替换
    ownerAddress = accounts[0];
  } else return;

  if (DEPLOY_ROUTE) {

    logger.log("====================================================");
    logger.log("network type: " + network);
    logger.log("Deploy time: " + new Date().toLocaleString());
    var tx;

    logger.log("Deploy type: Proxy");
    if (DODOApproveAddress == "") {
      await deployer.deploy(DODOApprove);
      DODOApproveAddress = DODOApprove.address;
      logger.log("DODOApprove Address: ", DODOApproveAddress);
    }
    if (DODOSellHelperAddress == "") {
      await deployer.deploy(DODOSellHelper);
      DODOSellHelperAddress = DODOSellHelper.address;
    }
    if (DODOSwapCalcHelperAddress == "") {
      await deployer.deploy(DODOSwapCalcHelper, DODOSellHelperAddress);
      DODOSwapCalcHelperAddress = DODOSwapCalcHelper.address;
      logger.log("DODOSwapCalcHelperAddress: ", DODOSwapCalcHelperAddress);
    }

    await deployer.deploy(
      DODOProxyV1,
      DODOApproveAddress,
      DODOSellHelperAddress,
      WETHAddress,
      chiAddress
    );
    logger.log("DODOProxyV1 Address: ", DODOProxyV1.address);
    const DODOProxyV1Instance = await DODOProxyV1.at(DODOProxyV1.address);
    tx = await DODOProxyV1Instance.initOwner(ownerAddress);
    logger.log("Set DODOProxyV1 Owner tx: ", tx.tx);

    const DODOApproveInstance = await DODOApprove.at(DODOApproveAddress);
    tx = await DODOApproveInstance.init(ownerAddress, DODOProxyV1.address);
    logger.log("Set DODOApprove Owner And Init Set Proxy tx: ", tx.tx);

    // var tx1 = await DODOProxyV1Instance.addWhiteList("0x111111125434b319222cdbf8c261674adb56f3ae");
    // var tx2 = await DODOProxyV1Instance.addWhiteList("0xf740b67da229f2f10bcbd38a7979992fcc71b8eb");
    // logger.log("AddWhiteList tx1: ", tx1.tx);
    // logger.log("AddWhiteList tx2: ", tx2.tx);
  }
};
