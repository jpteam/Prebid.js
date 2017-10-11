// import CONSTANTS from 'src/constants.json';
import { registerBidder } from 'src/adapters/bidderFactory';
// import * as utils from 'src/utils';

const BIDDER_CODE = 'c1x';
const URL = 'http://ht-integration.c1exchange.com:9000/ht';

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
    console.log(tagObj);

    payload = {
      siteId: siteId,
      adunits: adunits.toString(),
      rid: rid.toString(),
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
  interpretResponse: function(serverResponse, request) {
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

  getUserSyncs: function(syncOptions) {}
}

function bidToTag(bid, index) {
  const tag = {};
  const adIndex = 'a' + (index + 1).toString(); // ad unit id for c1x
  const sizeKey = adIndex + 's';
  // const priceKey = adIndex + 'p';
  const sizesArr = bid.sizes;
  tag[adIndex] = bid.adUnitCode;
  tag[sizeKey] = sizesArr.reduce((prev, current) => prev + (prev === '' ? '' : ',') + current.join('x'), '');

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
