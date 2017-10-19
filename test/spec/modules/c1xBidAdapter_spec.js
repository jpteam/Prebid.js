import { expect } from 'chai';
import { c1xAdapter } from 'modules/c1xBidAdapter';
import { newBidder } from 'src/adapters/bidderFactory';

const ENDPOINT = 'http://13.58.47.152:8080/ht';

describe('C1XAdapter', () => {
  const adapter = newBidder(c1xAdapter);

  describe('inherited functions', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', () => {
    let bid = {
      'bidder': 'c1x',
      'adUnitCode': 'adunit-code',
      'sizes': [[300, 250], [300, 600]]
    };

    it('should return false when required params are not passed', () => {
      let bid = Object.assign({}, bid);
      global.window.c1x_pubtag.siteId = '';
      console.log(global.window.location); // TO DO: check how to add attr to window obj
      expect(c1xAdapter.isBidRequestValid(bid)).to.equal(false);
    });
  });

  describe('buildRequests', () => {
    let bidRequests = [
      {
        'bidder': 'c1x',
        'adUnitCode': 'adunit-code',
        'sizes': [[300, 250], [300, 600]],
      }
    ];

    it('sends bid request to ENDPOINT via GET', () => {
      const request = c1xAdapter.buildRequests(bidRequests);
      expect(request.url).to.equal(ENDPOINT);
      expect(request.method).to.equal('GET');
    });
  });
});
