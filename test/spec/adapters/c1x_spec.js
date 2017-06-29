import {expect} from 'chai';
import C1XAdapter from 'src/adapters/c1x';
import bidmanager from 'src/bidmanager';
import adLoader from 'src/adloader';
import urlParse from 'url-parse';
// FYI: querystringify will perform encoding/decoding
import querystringify from 'querystringify';

let getDefaultBidderSetting = () => {
  return {
    bidderCode: 'c1x',
    bids: [{
      siteId: 9999,
      pixelId: 9999,
      sizes: [[300, 250]],
      placementCode: 'div-c1x-ht',
      endpoint: 'http://test.c1exchange.com:2000/ht',
      domain: 'http://c1exchange.com/'
    }]
  };
};

let getDefaultBidResponse = () => {
  return {
    bid: true,
    adId: 'div-c1x-ht',
    cpm: 3.31,
    ad: '<div><a target=\"_new\" href=\"http://c1exchange.com\"><img src=\"https://placeholdit.imgix.net/~text?txtsize=38&txt=C1X%20Ad%20300x250&w=300&h=250&txttrack=0\"></a></div>',
    width: 300,
    height: 250
  };
};

describe('c1x adapter tests: ', () => {
  window.pbjs = window.pbjs || {};
  if (typeof (pbjs) === 'undefined') {
    var pbjs = window.pbjs;
  }
  let stubLoadScript;
  let adapter;

  function createBidderRequest(bids) {
    let bidderRequest = getDefaultBidderSetting();
    if (bids && Array.isArray(bids)) {
      bidderRequest.bids = bids;
    }
    return bidderRequest;
  }

  beforeEach(() => {
    adapter = new C1XAdapter();
  });

  describe('check callBids()', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });
  describe('creation of bid url', () => {
    beforeEach(() => {
      stubLoadScript = sinon.stub(adLoader, 'loadScript');
    });
    afterEach(() => {
      stubLoadScript.restore();
    });
    it('should be called only once', () => {
      adapter.callBids(getDefaultBidderSetting());
      sinon.assert.calledOnce(stubLoadScript);
    });
    it('require parameters before call', () => {
      let xhr;
      let requests;
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = request => requests.push(request);
      adapter.callBids(getDefaultBidderSetting());
      expect(requests).to.be.empty;
      xhr.restore();
    });
    it('should send with correct parameters', () => {
      adapter.callBids(getDefaultBidderSetting());
      let expectedUrl = stubLoadScript.getCall(0).args[0];
      sinon.assert.calledWith(stubLoadScript, expectedUrl);
    });
    it('should hit endpoint with optional param', () => {
      let bids = [{
        siteId: 9999,
        sizes: [[300, 250]],
        placementCode: 'div-c1x-ht',
        endpoint: 'http://test.c1exchange.com:2000/ht',
        domain: 'http://c1exchange.com/',
        floorPriceMap: {
          '300x250': 4.00
        },
        dspid: 4288
      }];
      adapter.callBids(createBidderRequest(bids));
      let expectedUrl = stubLoadScript.getCall(0).args[0];
      sinon.assert.calledWith(stubLoadScript, expectedUrl);
    });
    it('should hit default bidder endpoint', () => {
      let bid = getDefaultBidderSetting();
      bid.bids[0].endpoint = null;
      adapter.callBids(bid);
      let expectedUrl = stubLoadScript.getCall(0).args[0];
      sinon.assert.calledWith(stubLoadScript, expectedUrl);
    });
    it('should throw error msg if no site id provided', () => {
      let bid = getDefaultBidderSetting();
      bid.bids[0].siteId = '';
      adapter.callBids(bid);
      sinon.assert.notCalled(stubLoadScript);
    });
    it('should get pixelId from bidder settings if no pixelId in bid request', () => {
      let bid = getDefaultBidderSetting();
      let responsePId;
      pbjs.bidderSettings['c1x'] = { pixelId: 4567 };
      bid.bids[0].pixelId = '';
      adapter.callBids(bid);
    });
    it('should not inject audience pixel if no pixelId provided', () => {
      let bid = getDefaultBidderSetting();
      let responsePId;
      pbjs.bidderSettings['c1x'] = null;
      bid.bids[0].pixelId = '';
      adapter.callBids(bid);
    });
  });
  describe('bid response', () => {
    let server;
    let stubAddBidResponse;
    beforeEach(() => {
      adapter = new C1XAdapter();
      server = sinon.fakeServer.create();
      stubAddBidResponse = sinon.stub(bidmanager, 'addBidResponse');
    });

    afterEach(() => {
      server.restore();
      stubAddBidResponse.restore();
    });

    it('callback function should exist', function () {
      expect(pbjs._c1xResponse).to.exist.and.to.be.a('function');
    });
    it('should be added to bidmanager if returned from bidder', () => {
      server.respondWith(JSON.stringify(getDefaultBidResponse()));
      adapter.callBids(getDefaultBidderSetting());
      server.respond();
      sinon.assert.calledOnce(stubAddBidResponse);
    });
    it('bidmanager.addBidResponse should be called twice with correct arguments', () => {
      adapter.callBids(getDefaultBidderSetting());
      var adUnits = new Array();
      var unit = new Object();
      unit.bids = [{
        bidder: 'c1x'
      }];
      unit.sizes = [[728, 90]];
      adUnits.push(unit);
      // pbjs._bidsRequested.push(params);
      // pbjs.adUnits = adUnits;
      pbjs._c1xResponse(JSON.stringify(getDefaultBidResponse()));
      var responseAdId = stubAddBidResponse.getCall(0).args[0];
      var bidObject = stubAddBidResponse.getCall(0).args[1];
      expect(responseAdId).to.equal('div-gpt-ad-44697-3');
      expect(bidObject.cpm).to.equal(3.31);
      expect(bidObject.width).to.equal(300);
      expect(bidObject.height).to.equal(250);
      expect(bidObject.ad).to.equal('<div><a target=\"_new\" href=\"http://c1exchange.com\"><img src=\"https://placeholdit.imgix.net/~text?txtsize=38&txt=C1X%20Ad%20300x250&w=300&h=250&txttrack=0\"></a></div>');
      expect(bidObject.getStatusCode()).to.equal(1);
      expect(bidObject.statusMessage).to.equal('Bid available');
      expect(bidObject.bidderCode).to.equal('c1x');
      sinon.assert.calledOnce(stubAddBidResponse);
    });
  });
  describe('handling of response with no bid', () => {
    var params = {
      bidderCode: 'c1x',
      bids: [{
        siteId: '9999',
        pixelId: 9999,
        sizes: [[300, 200]],
        adId: 'div-gpt-ad-1494499685685-0',
        endpoint: 'http://ht-integration.c1exchange.com:9000/ht',
        domain: 'http://c1exchange.com/'
      }]
    };
    var response = JSON.stringify([{'bid': false, 'adId': 'div-gpt-ad-1494499685685-0'}]);
    it('bidmanager.addBidResponse should be called with correct arguments and responding with no bid', () => {
      var stubAddBidResponse = sinon.stub(bidmanager, 'addBidResponse');
      adapter.callBids(params);
      var adUnits = new Array();
      var unit = new Object();
      unit.bids = [params];
      unit.sizes = [[728, 90]];
      adUnits.push(unit);
      if (typeof (pbjs._bidsRequested) === 'undefined') {
        pbjs._bidsRequested = [params];
      } else {
        pbjs._bidsRequested.push(params);
      }
      pbjs.adUnits = adUnits;
      pbjs._c1xResponse(response);
      var code1 = stubAddBidResponse.getCall(0).args[0];
      var bidObject1 = stubAddBidResponse.getCall(0).args[1];
      expect(bidObject1.statusMessage).to.equal('Bid returned empty or error response');
    });
  });
});
