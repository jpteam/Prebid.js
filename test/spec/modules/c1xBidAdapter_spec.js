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
      'sizes': [[300, 250], [300, 600]],
      'params': {
        'siteId': '9999'
      }
    };

    it('should return true when required params are passed', () => {
      expect(c1xAdapter.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params are not found', () => {
      let bid = Object.assign({}, bid);
      delete bid.params;
      bid.params = {
        'siteId': null
      };
      expect(c1xAdapter.isBidRequestValid(bid)).to.equal(false);
    });
  });
});
