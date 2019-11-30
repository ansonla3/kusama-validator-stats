const{ ApiPromise, WsProvider } = require('@polkadot/api');
const { isHex } = require('@polkadot/util');
const DOT_DECIMAL_PLACES = 1000000000000;


(async () => {

    function check(current_validator, stake, commission) {
	if (isNaN(highest_amount)) {
	    // If highest_amount is NaN, this must be the
	    // first.  Set this validator to highest and lowest everything.
	    lowest = highest = current_validator;
	    lowest_amount = highest_amount = stake;
	    lowest_commission = highest_commission = current_validator;
	    lowest_commission_amount = highest_commission_amount = commission;
	} else {

	    // Check total stake

	    if (stake > highest_amount) {
		highest = current_validator;
		highest_amount = stake;
	    } else if (stake < lowest_amount) {
		lowest = current_validator;
		lowest_amount = stake;
	    }

	    // Check commissions

	    if (commission > highest_commission_amount) {
		highest_commission = current_validator;
		highest_commission_amount = commission;
	    } else if (commission < lowest_commission_amount) {
		lowest_commission = current_validator;
		lowest_commission_amount = commission;
	    }
	}
    }

    function showUsageAndExit() {
	console.log("Arguments:");
	console.log("\tno-superlatives: don't show superlatives (highest/lowest stake, highest/lowest commission)");
	console.log("\tno-nominators: don't show individual nominators, just number");
	process.exit(1);
    }

    function readArgs() {
	let a = process.argv;
	for (j = 2; j < a.length; j++) {
	    if (a[j] === "no-superlatives") {
		showSuperlatives = false;
	    } else if (a[j] === "no-nominators") {
		showNominators = false;
	    } else {
		console.log(`Did not understand argument ${a[j]}`);
		showUsageAndExit();
	    }
	}

    }


    const provider = new WsProvider('wss://kusama-rpc.polkadot.io/')
    const api = await ApiPromise.create({ provider })

    const [ currentValidators, totalIssuance ] = await Promise.all([
	api.query.session.validators(),
	api.query.balances.totalIssuance()
    ]);

    const totalKSM = parseInt(totalIssuance.toString())
    let totalBondingStake = 0;
    let lowest = "no one";
    let highest = "no one";
    let highest_amount = NaN;
    let lowest_amount = NaN;
    let highest_commission = "no one";
    let lowest_commission = "no one";
    let highest_commission_amount = NaN;
    let lowest_commission_amount = NaN;

    let showNominators = true;
    let showSuperlatives = true;

    readArgs();

    for (let i=0; i<currentValidators.length; i++) {
	const validatorTotalStake = await api.query.staking.stakers(currentValidators[i])
	const validatorCommissioneRate = await api.query.staking.validators(currentValidators[i])

	console.log(`Stash Address: ${currentValidators[i].toString()}.\n\tTotal stake:${validatorTotalStake['total'] / DOT_DECIMAL_PLACES}\n\tSelf stake: ${validatorTotalStake['own'].toString() / DOT_DECIMAL_PLACES}`)
	console.log(`\tCommission: ${validatorCommissioneRate[0]['validatorPayment'] / DOT_DECIMAL_PLACES} KSM`)
	check(currentValidators[i].toString(), parseInt(validatorTotalStake['total']), parseInt(validatorCommissioneRate[0]['validatorPayment']))
	console.log('\tNominators:', validatorTotalStake['others'].length)

	if (showNominators) {
	    for (let j=0; j<validatorTotalStake['others'].length; j++) {
		console.log(`\tAddress: ${validatorTotalStake['others'][j]['who']}, Stake: ${validatorTotalStake['others'][j]['value'] / DOT_DECIMAL_PLACES}`)
	    }
	}
	console.log();

	totalBondingStake += parseInt(validatorTotalStake['total'])
    }


    console.log("\nSummary Data:");
    console.log(`Total KSM: ${totalKSM / DOT_DECIMAL_PLACES}`);
    console.log(`Bonding Stake: ${totalBondingStake / DOT_DECIMAL_PLACES} KSM`);
    console.log(`Staking Rate: ${totalBondingStake / totalKSM * 100} %`);

    if (showSuperlatives) {
	console.log(`Highest-staked validator: ${highest} : ${highest_amount / DOT_DECIMAL_PLACES} KSM`);
	console.log(`Lowest-staked validator: ${lowest} : ${lowest_amount / DOT_DECIMAL_PLACES} KSM`);
	console.log(`Highest commission validator: ${highest_commission} : ${highest_commission_amount / DOT_DECIMAL_PLACES} KSM`);
	console.log(`Lowest commission validator: ${lowest} : ${lowest_commission_amount / DOT_DECIMAL_PLACES} KSM`);
    }

    process.exit()
})()
