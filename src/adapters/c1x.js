var CONSTANTS = require('../constants.json');
var utils = require('../utils.js');
var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var adloader = require('../adloader');
/**
 * Adapter for requesting bids from C1X header tag server.
 * v2.0 (c) C1X Inc., 2017
 *
 * @param {Object} options - Configuration options for C1X
 *
 * @returns {{callBids: _callBids}}
 * @constructor
 */
var C1XAdapter = function C1XAdapter() {
  // default endpoint. Can be overridden by adding an "endpoint" property to the first param in bidder config.
  var ENDPOINT = 'http://ht-integration.c1exchange.com:9000/ht',
    PIXEL_ENDPOINT = '//px.c1exchange.com/pubpixel/',
    PIXEL_FIRE_DELAY = 3000,
    ERROR_MSG = {
      noSite: 'C1X: ERROR no site id supplied',
      noBid: 'C1X: INFO creating a NO bid for Adunit: ',
      bidWin: 'C1X: INFO creating a bid for Adunit: '
    };

  var pbjs = window.pbjs || {};

  pbjs._c1xResponse = function(c1xResponse) {
    if (c1xResponse) {
      var response = c1xResponse;

      if (typeof c1xResponse === CONSTANTS.objectType_string) {
        response = JSON.parse(c1xResponse);
      }
      console.log('Response Length: ');
      console.log(response.length);
      if (response) {
        for (var i = 0; i < response.length; i++) {
          var data = response[i],
            bidObject = null;
          if (data.bid) {
            bidObject = bidfactory.createBid(1);
            bidObject.bidderCode = 'c1x';
            bidObject.cpm = data.cpm;
            bidObject.ad = data.ad;
            bidObject.width = data.width;
            bidObject.height = data.height;
            console.log(ERROR_MSG.bidWin + data.adId + ' size: ' + data.width + 'x' + data.height);
            bidmanager.addBidResponse(data.adId, bidObject);
          } else {
            // no bid.
            bidObject = bidfactory.createBid(2);
            bidObject.bidderCode = 'c1x';
            console.log(ERROR_MSG.nobid + data.adId);
            bidmanager.addBidResponse(data.adId, bidObject);
          }
        }
      }
    }
  };

  var pbjs = window.pbjs || {};

  function getSettings(key) {
    if (pbjs && pbjs.bidderSettings['c1x']) {
      var c1xSettings = pbjs.bidderSettings['c1x'];
      return c1xSettings[key];
    } else {
      return null;
    }
  }
  // inject the audience pixel only if pbjs.bidderSettings['c1x'].pixelId is set.
  function injectAudiencePixel(pixel) {
    var pixelId = pixel;
    if (pixelId) {
      window.setTimeout(function() {
        var pixel = document.createElement('img');
        pixel.width = 1;
        pixel.height = 1;
        pixel.style = 'display:none;';
        var useSSL = document.location.protocol;
        pixel.src = (useSSL ? 'https:' : 'http:') + PIXEL_ENDPOINT + pixelId;
        document.body.insertBefore(pixel, null);
      }, PIXEL_FIRE_DELAY);
    }
  }

  function _callBids(params) {
    var bids = params.bids;

    if (bids[0].pixelId || getSettings('pixelId')) {
      var pixelId = bids[0].pixelId ? bids[0].pixelId : getSettings('pixelId');
      injectAudiencePixel(pixelId);
    }

    var siteId = bids[0].siteId ? bids[0].siteId : getSettings('siteId');
    if (!siteId) {
      console.log(ERROR_MSG.noSite);
      return;
    }

    var options = ['adunits=' + bids.length];
    options.push('site=' + siteId);
    for (var i = 0; i < bids.length; i++) {
      options.push('a' + (i + 1) + '=' + bids[i].placementCode);
      var sizes = bids[i].sizes,
        sizeStr = sizes.reduce(function(prev, current) { return prev + (prev === '' ? '' : ',') + current.join('x') }, '');
// send floor price if the setting is available.
      var floorPriceMap = bids[i].floorPriceMap;
      if (floorPriceMap) {
        var adUnitSize = sizes[0].join('x');
        if (adUnitSize in floorPriceMap) {
          options.push('a' + (i + 1) + 'p=' + floorPriceMap[adUnitSize]);
        }
      }
      options.push('a' + (i + 1) + 's=[' + sizeStr + ']');
    }
    options.push('rnd=' + new Date().getTime());  // cache busting
    var c1xEndpoint = ENDPOINT;
    if (bids[0].endpoint) {
      c1xEndpoint = bids[0].endpoint;
    }
    if (bids[0].dspid) {
      options.push('dspid=' + bids[0].dspid);
    }
    var url = c1xEndpoint + '?' + options.join('&');
    window._c1xResponse = function (c1xResponse) {
      pbjs._c1xResponse(c1xResponse);
    };
    adloader.loadScript(url);
  }
  // Export the callBids function, so that prebid.js can execute this function
  // when the page asks to send out bid requests.
  return {
    callBids: _callBids
  };
};
module.exports = C1XAdapter;
