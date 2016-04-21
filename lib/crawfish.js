var SimpleCrawler = require('simplecrawler').Crawler,
    EventEmitter  = require('events').EventEmitter,
    _ = require('underscore'),
    urlUtil = require('url');

var crawfish = new EventEmitter();

crawfish.crawl = function(url, options, callback) {
  var pages = {},
      potentialPages = {},
      urlObject = urlUtil.parse(url, true),
      urlPort = urlObject.port ? urlObject.port : 80;

  crawler = new SimpleCrawler(urlObject.hostname, urlObject.path, urlPort);

  crawler.interval = 100;
  crawler.maxConcurrency = 10;
  crawler.scanSubdomains = true;
  crawler.downloadUnsupported = false;

  var conditionID = crawler.addFetchCondition(function(parsedURL, queueItem) {
    return (queueItem.stateData.contentType.indexOf('text/html') != -1);
  });

  var crawfishHandler = function(queueItem, responseBuffer, response) {
    console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
    crawler.emit("crawl", queueItem.url);
    var page = {},
        parsedUrl = urlUtil.parse(queueItem.url, true);

    // if (queueItem.stateData.contentType === 'text/html') {
      page.url = queueItem.url;
      // page.contentType = queueItem.stateData.contentType;

      pages[parsedUrl.path] = page;
    // }
  };

  crawler.on('crawlstart', function() {
    console.log('Crawling...');
  });

  crawler.on('fetchcomplete', crawfishHandler);

  crawler.on('fetch404', function(queueItem) {
    console.log('404 Error on %s', queueItem.url)
  });

  crawler.on('discoverycomplete', function(queueItem, resources) {
    var parsedUrl = urlUtil.parse(queueItem.url, true);
    pages[parsedUrl.path].links = resources;

    resources.forEach(function(link) {
      var resourceUrl = urlUtil.parse(urlUtil.resolve(parsedUrl, urlUtil.parse(link,true)), true);
      if (!pages[resourceUrl.path]) {
        if (!potentialPages[resourceUrl.path]) potentialPages[resourceUrl.path] = { referrers: [] };
          potentialPages[resourceUrl.path].referrers.push(queueItem.url);
      } else {
        if (!pages[resourceUrl.path].referrers) pages[resourceUrl.path].referrers = [];
        pages[resourceUrl.path].referrers.push(queueItem.url);
      }
    });
  });

  crawler.on('complete', function() {
    callback(null, _.map(pages, function (value, key) {
      return value;
    }));
    console.log('It was lit, fam.');
  });

  crawler.start();
}

module.exports = crawfish;
