// todo:
// get rid of crawlback city
// refactor referrers/links function
//

var SimpleCrawler = require('simplecrawler').Crawler,
    EventEmitter  = require('events').EventEmitter,
    _ = require('underscore'),
    urlUtil = require('url');

var crawfish = new EventEmitter();

crawfish.crawl = function(url, options, callback) {

  var pages           = {},
      notFound        = {},
      potentialPages  = {},
      urlObject       = urlUtil.parse(url, true),
      urlHostname     = urlObject.hostname; 
      urlPath         = urlObject.path;
      urlProtocol     = urlObject.protocol;
      urlPort         = urlObject.port ? urlObject.port : 80;

  if (urlObject.hostname == null) {

    // Hostname will be null if the user only typed the domain name.
    // This will correct that and warn the user.

    urlHostname = urlObject.path;
    urlPath     = '/';

  }

  crawler = new SimpleCrawler(urlHostname, urlPath, urlPort);

  // Set up crawler options. Eventually want to turn this these into flags.
  crawler.interval            = 100;
  crawler.maxConcurrency      = 10;
  crawler.scanSubdomains      = true;
  crawler.downloadUnsupported = false;

  // Set up crawler conditions
  // We only want pages for now. This will eventually grab media and display
  // their content type.
  var conditionID = crawler.addFetchCondition(function(parsedURL, queueItem) {
    if (parsedURL.path.match(/\.(css|xml|gif|jpg|pdf|docx|js|png|ico)/i)) {
      return false;
    }

    return true;
  });

  // Our main handler for the crawler. 
  var crawfishHandler = function(queueItem, responseBuffer, response) {
    var page      = {},
        parsedUrl = urlUtil.parse(queueItem.url, true);

    if (options.v) {
      console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
    }

    crawler.emit("crawl", queueItem.url);

    page.url = queueItem.url;
    pages[parsedUrl.path] = page;
  };

  crawler.on('fetchcomplete', crawfishHandler);

  crawler.on('crawlstart', function() {
    console.log('\n' + 'Crawling Website: ', urlHostname + urlPath);

    if (options.v) {
      console.log('\n' + 'Hostname: ', urlHostname);
      console.log('Host: ', urlObject.host);
      console.log('Path: ', urlPath);
      console.log('Protocol ', urlObject.protocol);
      console.log('Port: ', urlObject.port + "\n");
    }
  });

  crawler.on('fetch404', function(queueItem) {

    // If this referrer doesn't exist in our notFound list, set one up
    if (!notFound[queueItem.referrer]) {
      notFound[queueItem.referrer] = { 
        link: queueItem.referrer, 
        notfound: [] 
      };

      // Push the URL to the referrer where the 404 link orinated.
      notFound[queueItem.referrer].notfound.push(queueItem.url);
    }

    if (options.v) {
      console.log('404 Error on %s', queueItem.url)
    }
  });

  crawler.on('discoverycomplete', function(queueItem, resources) {
    var parsedUrl = urlUtil.parse(queueItem.url, true);

    // Only add links if the -l flag was used
    if (options.l) {
      pages[parsedUrl.path].links = resources;
    }

    resources.forEach(function(link) {
      var resourceUrl = urlUtil.parse(urlUtil.resolve(parsedUrl, urlUtil.parse(link,true)), true);

      // Check for the path in the pages list
      if (!pages[resourceUrl.path]) {

        // If the path isn't in the pages list:
        // Check the potential pages list for the resource URL then add to it.
        if (options.r) {
          if (!potentialPages[resourceUrl.path]) {
            potentialPages[resourceUrl.path] = { referrers: [] };
          } else {
            potentialPages[resourceUrl.path].referrers.push(queueItem.url);
          }
        }

      } else {

        // If the path is in the pages list: 
        // Check for the resource URL then add to it.
        if (options.r) {
          if (!pages[resourceUrl.path].referrers) { 
            pages[resourceUrl.path].referrers = [];
          } else {
            pages[resourceUrl.path].referrers.push(queueItem.url);
          }
        }

      }
    });
  });

  crawler.on('complete', function() {
    // Here we're passing both the results and the 404 lists to the callback.
    callback(null,
            _.map(pages, function (value, key) {
              return value;
            }),
            _.map(notFound, function (value, key) {
              return value;
            })
    );

    // Come thru fam
    console.log('\nIt was lit, fam.');
  });

  // Start the crawler.
  crawler.start();
}

module.exports = crawfish;
