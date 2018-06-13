const utils = require('./utils');
const Web3 = require('web3');
const util = require('ethereumjs-util');
const leftPad = require('left-pad')
const conf = require('./config.json');


const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.decenter.com"));

const assetManagerContractAddress = conf.assetManagerContract.networks["42"].address;
const assetManagerContract = new web3.eth.Contract(conf.assetManagerContract.abi, assetManagerContractAddress);

const digitalPrintImageContractAddress = conf.digitalPrintImageContract.networks["42"].address;
const digitalPrintImageContract = new web3.eth.Contract(conf.digitalPrintImageContract.abi, digitalPrintImageContractAddress);

// Function to pick ten random integers [0,99]
// Will be executed during generating initial random seed
function pickTenRandoms(){
    let randoms = [];
    for(let i=0; i<10; i++){
        randoms.push(Math.floor(Math.random()*100));
    }
    return randoms;
}


async function calculatePrice(pickedAssets, owner) {
    console.log(pickedAssets);
    if(pickedAssets.length == 0){
        return 0;
    }

    if(owner.toString().length!=42){
        return null;
    }

    let price = await digitalPrintImageContract.methods.calculatePrice(pickedAssets,owner).call();
    return price;
}

// Function to get total number of assets existing on contract
async function getNumberOfAssets(){
    let number = await assetManagerContract.methods.getNumberOfAssets().call();
    console.log(assetManagerContract.methods.getNumberOfAssets())
    console.log(await assetManagerContract.methods.getNumberOfAssets().call())
    return number;
}

async function getUserImages(address) {
    if (address.length != 42) {
        return -1;
    }
    let imageIds = await digitalPrintImageContract.methods.getUserImages(address).call();
    return imageIds;
}

// async function getUserImageMetadata(address, image_id) {
//     let images = await getUserImages(address);
//     for(let i=0; i<images.length; i++) {
//         let imageId = parseInt(images[i],10);
//
//     }
// }
async function convertSeed(randomSeed) {
    let seed = await digitalPrintImageContract.methods.toHex(randomSeed).call();
    return seed;
}
//
// async function getNumberOfImages() {
//     // let number = await digitalPrintImageContract.methods.numOfImages
//     return number;
// }

// Function to calculate first random seed, it will be executed from contract

async function calculateFirstSeed(timestamp, rands) {
    console.log("Timestamp: " + timestamp);
    console.log("Rands: " + rands);
    let randomSeed = await digitalPrintImageContract.methods.calculateSeed(rands,timestamp).call();
    console.log("RANDOM SEED: " + randomSeed)
    return randomSeed;
}

// Function to calculate keccak256 when input is (int and int)
// INTEGRATED WITH CONTRACT
function calculateSeed(random_seed,x){
    var hash = web3.utils.sha3(leftPad((random_seed).toString(16), 64, 0) +
        leftPad((x).toString(16), 64, 0),
        {encoding : "hex"});
    return hash;
}

// Function to calculate final seed for input (random_seed -int & iterations-int)
// INTEGRATED WITH CONTRACT
function calculateFinalSeed(random_seed, iterations){
    var seed = calculateSeed(random_seed, iterations);
    for(let i=0; i<iterations; i++){
        // seed = seed.toString().substr(2);
        let x = leftPad((i).toString(16),64,0);
        seed = web3.utils.sha3(seed + x, {encoding: "hex"});
    }
    return seed;
}


//Function to get metadata for asset based on random seed and assetId
//seed - bytes32 ; assetId - integer
function getAssetMetadata(seed, assetId){
    seed = seed.toString();
    let number = parseInt(seed.substr(seed.length-4),10);
    // If number can be divided by 2 means that asset will be included into image
    if(number%2==0) {
        let id = assetId;
        let x_coordinate = number % 2450;
        let y_coordinate = number % 3500;
        let zoom = number % 200 + 800;
        let rotation = number % 360;
        let Asset = {
            id: id,
            x_coordinate: x_coordinate,
            y_coordinate: y_coordinate,
            zoom: zoom,
            rotation: rotation
        };
        return Asset;
    }
    return null;
}



//INTEGRATED WITH CONTRACT - function to getImage info
//(bytes32, uint, bytes32)
function getImage(random_seed, iterations, potentialAssets){
    random_seed = random_seed.toString(16);
    var seed = calculateFinalSeed(random_seed,iterations);
    var pot_assets = utils.decode(potentialAssets).reverse();
    var pickedAssets = [];

    for(let i=0; i<pot_assets.length; i++){
        // seed = seed.substr(2);
        let q = leftPad((pot_assets[i]).toString(16),64,0);
        seed = web3.utils.sha3(seed + q, {encoding:"hex"});

        let x = utils.hex2dec(seed); //BIGINT representation of seed

        let metadata  = getAssetMetadata(x, pot_assets[i]);

        if(metadata!=null) {
            pickedAssets.push(metadata);
        }
    }
    return pickedAssets;
}

//Function to get data from contract for every asset (id,creator, ipfsHash, and price) - based on asset id
async function getAssetStats(id) {
    let numberOfAssets = await assetManagerContract.methods.getNumberOfAssets().call();
    numberOfAssets = parseInt(numberOfAssets,10);
    let layer = Math.floor(Math.random() * 10);
    if(id >= numberOfAssets) {
        return null;
    }else {
        let info = await assetManagerContract.methods.getAssetInfo(id).call();
        let Info = {
            id : parseInt(info[0], 10),
            creator  : info[1],
            ipfsHash : info[2],
            price : parseInt(info[3], 10),
            layer : layer
        }
        return Info;
    }
}

async function test() {
     // assets = getImage(13123,5, ["0x0000000000000000000001000002000003000004000005000006000007000008"]);
     // printImageData(assets);
     // console.log(getAssetMetadata("0x123f12ddd3ffaa",5));

    let images = await getUserImages("0xf67cDA56135d5777241DF325c94F1012c72617eA");
    console.log(images);
}

function printImageData(assets) {
    for(let i=0; i<assets.length; i++){
        let obj = assets[i];
        console.log(obj)
    }
}

test();

module.exports = {
    getImage,
    getAssetStats,
    getNumberOfAssets,
    calculatePrice,
    // getNumberOfImages,
    calculateFirstSeed,
    pickTenRandoms,
    getUserImages,
    convertSeed
}