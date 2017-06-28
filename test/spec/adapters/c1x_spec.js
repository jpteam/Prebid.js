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

describe('c1x adapter tests', () => {
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
    stubLoadScript = sinon.stub(adLoader, 'loadScript');
    adapter = new C1XAdapter();
  });
  afterEach(() => {
    stubLoadScript.restore();
  });

  describe('check callBids()', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });
  describe('creation of bid url', () => {
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
    it('should send with correct parameters', function () {
      adapter.callBids(getDefaultBidderSetting());
      let expectedUrl = stubLoadScript.getCall(0).args[0];
      sinon.assert.calledWith(stubLoadScript, expectedUrl);
    });
    it('should hit endpoint with optional parameters', function () {
      let bids = [{
        siteId: '9999',
        pixelId: 9999,
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
  });
  describe('creation of bid url without default parameter', function () {
    it('should fix without default parameter', function () {
      var params = {
        bidderCode: 'c1x',
        bids: [{
          pixelId: 9999,
          sizes: [[300, 250]],
          adId: 'div-c1x-ht',
          endpoint: 'http://ht-integration.c1exchange.com:9000/ht',
          domain: 'http://c1exchange.com/'
        }]
      };
      adapter.callBids(params);
    });
  });
  describe('handling of the callback response', function () {
    var params = {
      bidderCode: 'c1x',
      bids: [{
        siteId: '9999',
        pixelId: 9999,
        sizes: [[728, 90]],
        adId: 'div-gpt-ad-44697-3',
        endpoint: 'http://ht-integration.c1exchange.com:9000/ht',
        domain: 'http://c1exchange.com/'
      },
      {
        siteId: '9999',
        // pixelId: 9999,
        sizes: [[300, 250]],
        adId: 'div-gpt-ad-1494499685659-0',
        endpoint: 'http://ht-integration.c1exchange.com:9000/ht',
        domain: 'http://c1exchange.com/'
      }]
    };
    var response = JSON.stringify([{'bid': true, 'adId': 'div-gpt-ad-44697-3', 'cpm': 0.092, 'ad': '<script>document.write(\'<img src=\"https://trks.c1exchange.com/trk/c?pid=124&et=i&profileid=124&pubgrpid=NA&cpm=0.092&gen-ts=1496922418719&region=east&siteid=14793&rndid=1072038560&imprtype=IMAGE&adomain=[dell.co.in]&adaptertype=HTTP&urid=6280302705506284354&uimprid=7662199905952189060&urespid=0&at=1&pus=N&netprice=0.092&grossprice=0.092&sspauctionprice=0.092&dealId=NA&tagid=NA&publisherId=NA&dspBidPrice=0.092&dspcid=358496&adsize=728x90&adslot=div-gpt-ad-44697-3\" style=\"display:none;\"/>\')</script><script>document.write(\'<img src=\"https://s6-pixel.c1exchange.com/pubpixel/1000\" style=\"display:none;\"/>\')</script><script>document.write(\'<img src=\"https://pixel.mathtag.com/sync/img?redir=https://cms.c1exchange.com/cookie/match/mm?mmuuid=[MM_UUID]&mt_uuid=[MM_UUID]&no_iframe=1&apn=\" style=\"display:none\"/>\');</script><script language=\'JavaScript\' src=\'https://tags.mathtag.com/notify/js?exch=gor&id=5aW95q2jLzEzLyAvWmpNNU1EVTROV0V0TVRSaVpDMDBaakF3TFdKbFpURXRaR1EwWXpRd01EUXpPRFUzLzgzOTgwMTAxMDcyMDA3OTQxMC80MjY3MDU2LzIyMDI1OTkvNTcvNHRCQm41TUF5TnpwU1UwUnotWURRUFo0ZjhobzhSMko3SjlxMWt2RGZITS8xLzU3LzE0OTU1MjgwNzMvMC80Mjc2OTkvMTk0NTY4NDIyNS8xNTgzNTUvMzU4NDk2LzEvMC8wL1pqTTVNRFU0TldFdE1UUmlaQzAwWmpBd0xXSmxaVEV0WkdRMFl6UXdNRFF6T0RVMy8wLzAvMC8wLzAv/bNi589vo2QweoiBCN-adWjOKy2E&sid=2202599&cid=4267056&nodeid=1070&price=0.092&group=us-east&auctionid=839801010720079410&bid=&pbs_id=839801010720079410&bp=a_ajcdia\'></script>', 'width': 728, 'height': 90}, {'bid': true, 'adId': 'div-gpt-ad-1494499685659-0', 'cpm': 3.31, 'ad': '<div><a target=\"_new\" href=\"http://c1exchange.com\"><img src=\"https://placeholdit.imgix.net/~text?txtsize=38&txt=C1X%20Ad%20300x250&w=300&h=250&txttrack=0\"></a></div>', 'width': 300, 'height': 250}]);
    it('callback function should exist', function () {
      expect(pbjs._c1xResponse).to.exist.and.to.be.a('function');
    });
    it('bidmanager.addBidResponse should be called twice with correct arguments', function () {
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
      var code2 = stubAddBidResponse.getCall(1).args[0];
      var bidObject2 = stubAddBidResponse.getCall(1).args[1];
      expect(code1).to.equal('div-gpt-ad-44697-3');
      expect(bidObject1.cpm).to.equal(0.092);
      expect(bidObject1.ad).to.equal('<script>document.write(\'<img src=\"https://trks.c1exchange.com/trk/c?pid=124&et=i&profileid=124&pubgrpid=NA&cpm=0.092&gen-ts=1496922418719&region=east&siteid=14793&rndid=1072038560&imprtype=IMAGE&adomain=[dell.co.in]&adaptertype=HTTP&urid=6280302705506284354&uimprid=7662199905952189060&urespid=0&at=1&pus=N&netprice=0.092&grossprice=0.092&sspauctionprice=0.092&dealId=NA&tagid=NA&publisherId=NA&dspBidPrice=0.092&dspcid=358496&adsize=728x90&adslot=div-gpt-ad-44697-3\" style=\"display:none;\"/>\')</script><script>document.write(\'<img src=\"https://s6-pixel.c1exchange.com/pubpixel/1000\" style=\"display:none;\"/>\')</script><script>document.write(\'<img src=\"https://pixel.mathtag.com/sync/img?redir=https://cms.c1exchange.com/cookie/match/mm?mmuuid=[MM_UUID]&mt_uuid=[MM_UUID]&no_iframe=1&apn=\" style=\"display:none\"/>\');</script><script language=\'JavaScript\' src=\'https://tags.mathtag.com/notify/js?exch=gor&id=5aW95q2jLzEzLyAvWmpNNU1EVTROV0V0TVRSaVpDMDBaakF3TFdKbFpURXRaR1EwWXpRd01EUXpPRFUzLzgzOTgwMTAxMDcyMDA3OTQxMC80MjY3MDU2LzIyMDI1OTkvNTcvNHRCQm41TUF5TnpwU1UwUnotWURRUFo0ZjhobzhSMko3SjlxMWt2RGZITS8xLzU3LzE0OTU1MjgwNzMvMC80Mjc2OTkvMTk0NTY4NDIyNS8xNTgzNTUvMzU4NDk2LzEvMC8wL1pqTTVNRFU0TldFdE1UUmlaQzAwWmpBd0xXSmxaVEV0WkdRMFl6UXdNRFF6T0RVMy8wLzAvMC8wLzAv/bNi589vo2QweoiBCN-adWjOKy2E&sid=2202599&cid=4267056&nodeid=1070&price=0.092&group=us-east&auctionid=839801010720079410&bid=&pbs_id=839801010720079410&bp=a_ajcdia\'></script>');
      expect(bidObject1.width).to.equal(728);
      expect(bidObject1.height).to.equal(90);
      expect(bidObject1.getStatusCode()).to.equal(1);
      expect(bidObject1.statusMessage).to.equal('Bid available');
      expect(bidObject1.bidderCode).to.equal('c1x');
      expect(code2).to.equal('div-gpt-ad-1494499685659-0');
      expect(bidObject2.cpm).to.equal(3.31);
      expect(bidObject2.ad).to.equal('<div><a target=\"_new\" href=\"http://c1exchange.com\"><img src=\"https://placeholdit.imgix.net/~text?txtsize=38&txt=C1X%20Ad%20300x250&w=300&h=250&txttrack=0\"></a></div>');
      expect(bidObject2.width).to.equal(300);
      expect(bidObject2.height).to.equal(250);
      sinon.assert.calledTwice(stubAddBidResponse);
      stubAddBidResponse.restore();
    });
  });
  describe('handling of response with no bid', function () {
    if (typeof (pbjs._bidsReceived) === 'undefined') {
      pbjs._bidsReceived = [];
    }
    if (typeof (pbjs._bidsRequested) === 'undefined') {
      pbjs._bidsRequested = [];
    }
    if (typeof (pbjs._adsReceived) === 'undefined') {
      pbjs._adsReceived = [];
    }
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
    it('callback function should exist', function () {
      expect(pbjs._c1xResponse).to.exist.and.to.be.a('function');
    });
    it('bidmanager.addBidResponse should be called with correct arguments and responding with no bid', function () {
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
