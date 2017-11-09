// import CONSTANTS from 'src/constants.json';
import { registerBidder } from 'src/adapters/bidderFactory';
// import * as utils from 'src/utils';

const BIDDER_CODE = 'c1x';
const URL = 'http://13.58.47.152:8080/ht';
const PIXEL_ENDPOINT = '//px.c1exchange.com/pubpixel/';
const PIXEL_FIRE_DELAY = 3000;

/**
 * Adapter for requesting bids from C1X header tag server.
 * v3.0 (c) C1X Inc., 2017
 */

export const c1xAdapter = {
  code: BIDDER_CODE,

  // check the bids sent to c1x bidder
  isBidRequestValid: function(bid) {
    const siteId = window.c1x_pubtag.siteId || '';
    return (bid.adUnitCode && siteId);
  },

  buildRequests: function(bidRequests) {
    let payload = {};
    let tagObj = {};
    const siteId = window.c1x_pubtag.siteId || '';
    const adunits = bidRequests.length;
    const rid = new Date().getTime();

    const c1xTags = bidRequests.map(bidToTag);

    // flattened tags in a tag object
    tagObj = c1xTags.reduce((current, next) => Object.assign(current, next));

    payload = {
      siteId: siteId,
      adunits: adunits.toString(),
      rid: rid.toString(),
      response: 'json',
      compress: 'gzip'
    }
    Object.assign(payload, tagObj);
    console.log(payload);

    let payloadString = stringifyPayload(payload);
    console.log(payloadString);

    // ServerRequest object
    return {
      method: 'GET',
      url: URL,
      data: payloadString
    };
  },

  // TO DO: Get JSON Responses from our bidder endpoint
  interpretResponse: function(serverResponse) {
    const bidResponses = [];
    const bidResponse = {
      requestId: '22222', // bidRequest.bidId,
      bidderCode: 'c1x', // spec.code,
      cpm: '2.5', // CPM,
      width: '300', // WIDTH,
      height: '250', // HEIGHT,
      creativeId: '8999', // CREATIVE_ID,
      dealId: '9999', // DEAL_ID,
      currency: 'USD', // CURRENCY,
      netRevenue: true,
      ttl: '250', // TIME_TO_LIVE,
      ad: '<html><h3>I am an ad</h3></html>', // CREATIVE_BODY
    };
    bidResponses.push(bidResponse);
    return bidResponses;
  },

  // Register user-sync pixels
  getUserSyncs: function(syncOptions) {
    const pixelId = window.c1x_pubtag.pixelId || '';
    window.setTimeout(function() {
      let pixel = document.createElement('img');
      pixel.width = 1;
      pixel.height = 1;
      pixel.style = 'display:none;';
      const useSSL = document.location.protocol;
      pixel.src = (useSSL ? 'https:' : 'http:') + PIXEL_ENDPOINT + pixelId;
      document.body.insertBefore(pixel, null);
    }, PIXEL_FIRE_DELAY);
  }
}

function bidToTag(bid, index) {
  const tag = {};
  const adIndex = 'a' + (index + 1).toString(); // ad unit id for c1x
  const sizeKey = adIndex + 's';
  const priceKey = adIndex + 'p';
  // TODO: Multiple Floor Prices

  const sizesArr = bid.sizes;
  const floorPriceMap = bid.params.floorPriceMap || '';
  tag[adIndex] = bid.adUnitCode;
  tag[sizeKey] = sizesArr.reduce((prev, current) => prev + (prev === '' ? '' : ',') + current.join('x'), '');

  const newSizeArr = tag[sizeKey].split(',');
  if(floorPriceMap) {
    newSizeArr.forEach( size => {
      if(size in floorPriceMap) {
        tag[priceKey] = floorPriceMap[size];
      } // we only accept one cpm price in floorPriceMap
    });
  }

  return tag;
}

function stringifyPayload(payload) {
  let payloadString = '';
  payloadString = JSON.stringify(payload).replace(/":"|","|{"|"}/g, (foundChar) => {
    if (foundChar == '":"') return '=';
    else if (foundChar == '","') return '&';
    else return '';
  });
  return payloadString;
}

registerBidder(c1xAdapter);
