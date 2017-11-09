# Overview

Module Name: C1X Bidder Adapter
Module Type: Bidder Adapter
Maintainer: cathy@c1exchange.com

# Description

Module that connects to Example's demand sources

# Test Parameters
```
  var adUnits = [
     {
         code: 'test-div',
         sizes: [[300, 250]],  // a display size
         bids: [
             {
                 bidder: 'c1x',
                 params: {
                     placement: '12345'
                 }
             }
         ]
     },
   ];
```