/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

// import * as assert from 'assert';

import { decimalStr } from '../utils/Converter';
import { DVMContext, getDVMContext } from '../utils/DVMContext';
import { assert } from 'chai';

let lp: string;
let trader: string;

async function init(ctx: DVMContext): Promise<void> {
  lp = ctx.SpareAccounts[0];
  trader = ctx.SpareAccounts[1];

  await ctx.mintTestToken(lp, decimalStr("10"), decimalStr("1000"));
  await ctx.mintTestToken(trader, decimalStr("10"), decimalStr("1000"));

  await ctx.transferBaseToDVM(lp, decimalStr("10"))
  await ctx.transferQuoteToDVM(lp, decimalStr("1000"))
  await ctx.DVM.methods.buyShares(lp).send(ctx.sendParam(lp));
}

describe("ConstPriceCase", () => {
  let snapshotId: string;
  let ctx: DVMContext;

  before(async () => {
    let AMMLikeDVMContextInitConfig = {
      lpFeeRate: decimalStr("0.002"),
      mtFeeRate: decimalStr("0.001"),
      k: "0",
      i: decimalStr("100"),
    };
    ctx = await getDVMContext(AMMLikeDVMContextInitConfig);
    await init(ctx);
  });

  beforeEach(async () => {
    snapshotId = await ctx.EVM.snapshot();
  });

  afterEach(async () => {
    await ctx.EVM.reset(snapshotId);
  });

  describe("trade", () => {

    it("basic state", async () => {
      assert.equal(await ctx.DVM.methods.getMidPrice().call(), decimalStr("100"))
    })

    it("buy", async () => {
      // buy
      await ctx.transferQuoteToDVM(trader, decimalStr("200"))
      await ctx.DVM.methods.sellQuote(trader).send(ctx.sendParam(trader))

      // trader balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(trader).call(),
        decimalStr("12")
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(trader).call(),
        decimalStr("800")
      );

      // vault balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(ctx.DVM.options.address).call(),
        decimalStr("8.000")
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(ctx.DVM.options.address).call(),
        decimalStr("1200")
      );

      // maintainer balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(ctx.Maintainer).call(),
        decimalStr("0")
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(ctx.Maintainer).call(),
        decimalStr("0")
      );
    });

    it("sell", async () => {

      // sell
      await ctx.transferBaseToDVM(trader, decimalStr("1"))
      await ctx.DVM.methods.sellBase(trader).send(ctx.sendParam(trader))

      // trader balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(trader).call(),
        decimalStr("9")
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(trader).call(),
        decimalStr("1100")
      );

      // vault balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(ctx.DVM.options.address).call(),
        decimalStr("11")
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(ctx.DVM.options.address).call(),
        decimalStr("900.0")
      );

      // maintainer balances
      assert.equal(
        await ctx.BASE.methods.balanceOf(ctx.Maintainer).call(),
        "0"
      );
      assert.equal(
        await ctx.QUOTE.methods.balanceOf(ctx.Maintainer).call(),
        decimalStr("0")
      );
    });
  });
});
