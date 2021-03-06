/**
 * 
 * @see https://github.com/PeterScott/simplesets-nodejs
 */
var sets = require('simplesets');
var path = require('path');
var fs = require('fs'); // var fs = require('fs-extra');

/**
 * Get all available sites
 */
var find = function (callback) {
  callback(null, sails.config.sites);
};

/**
 * Get all available site names without duplicates
 */
var findNames = function (callback) {
  var names = {};
  find(function(err, sites) {
    if(err) return callback(err);
    for (var i = sites.length - 1; i >= 0; i--) {
      names[sites[i].name] = sites[i].name;
    }
    callback(null, Object.keys(names));
  });
};

/**
 * Get all available site names without duplicates
 */
var findHosts = function (callback) {
  var hosts = new sets.Set([]);
  find(function(err, sites) {
    if(err) return callback(err);
    for (var i = 0; i < sites.length; i++) {
      for (var k = 0; k < sites[i].domains.length; k++) {
        hosts.add(sites[i].domains[k]);
      }
    }
    callback(null, hosts.array());
  });
};

/**
 * Get the corrent Site config from local.json that matchs the current host domain 
 *
 * @param {string} host - The current host of the site this function was called.
 * @param {siteConfCallback} [cb] - The callback that handles the response.
 * @returns {object|null} Returns the result or null if no callback is set. 
 */
var getCurrentSiteConfig = function (host, cb) {
  var errors = [
    "[MultisiteService.getCurrentSiteConfig] No site for host "+host+" in local.json defined!"
  ];
  // sails.log.debug("[MultisiteService.getCurrentSiteConfig] Get current site config for host: "+host);
  
  var found = false;
  for (var i = 0; i < sails.config.sites.length && !found; i++) {
    for (var k = 0; k < sails.config.sites[i].domains.length && !found; k++) {
      // TODO generate al regex on bootstrap
      var regex = sails.config.sites[i].domains[k];
      if(!sails.config.sites[i].matchsubdomain)
        regex = ".*"+regex;
      regex = regex.replace(/\./g , "\\\."); // www.bugwelder.com => /www\.bugwelder\.com/g
      
      var pattern = new RegExp(regex, 'g');

      if(pattern.test(host)) {
        // sails.log.debug("[MultisiteService.getCurrentSiteConfig] Match! "+pattern+" ("+sails.config.sites[i].domains[k]+") <=> "+host);
        found = true;
        if (cb) {
          return cb(null, sails.config.sites[i]);
        }
        return sails.config.sites[i];
      } else {
        // sails.log.debug("[services/MultisiteService.js] No match! "+pattern+" ("+sails.config.sites[i].domains[k]+") <=> "+host);
      }
    }
  }

  if (UlilityService.isFunction(cb)) {
    return cb(new Error(errors[0]));
  } else {
    return new Error(errors[0]);
  }
};

/**
 * Get the Site config from local.json that matchs the name
 *
 * @param {string} name - The site name.
 * @param {siteConfCallback} [cb] - The callback that handles the response.
 * @returns {object|null} Returns the result or null if no callback is set. 
 */
var getSiteConfigByName = function (name, cb) {
  var errors = [
    "[MultisiteService.getSiteConfigByName] No site for name "+name+" in local.json defined!"
  ];
  // sails.log.debug("[MultisiteService.getCurrentSiteConfig] Get current site config for host: "+host);
  
  var found = false;
  for (var i = 0; i < sails.config.sites.length && !found; i++) {
    if(sails.config.sites[i].name === name) {
      found = true;
      if (UlilityService.isFunction(cb)) {
        return cb(null, sails.config.sites[i]);
      } 
      return sails.config.sites[i];
    }

  }

  if (UlilityService.isFunction(cb)) {
    return cb(new Error(errors[0]));
  } else {
    return new Error(errors[0]);
  }
};

/**
 * getCurrentSiteConfig callback
 * @callback siteConfCallback
 * @param {string|null} error
 * @param {object} config
 */

/**
 * Get fallcack site dirname as a last alternative.
 */
var getFallbackDirname = function (filepath, cb) {
  var dirname = path.resolve(sails.config.paths.public, sails.config.paths.sites, sails.config.paths.fallback);
  var fullpath = path.join(dirname, filepath);
  if(fs.existsSync(fullpath)) {
    cb(null, dirname);
  } else {
    var err = "[MultisiteService.getFallbackDirname] File not found in fallback assets dirname: "+fullpath;
    // sails.log.debug(err, fullpath);
    cb(err, dirname);
  }
};

/**
 *
 */
var getSitePathFromSiteConf = function (config, cb) {
  var site = config.name;
  var dirname = path.resolve(sails.config.paths.public, sails.config.paths.sites, site);
  if(cb) return cb(null, dirname);
  return dirname;
};

/**
 * Get site dirname from siteConf.
 * Use this function if you have already the siteconf. 
 */
var getSiteDirnameFromSiteConf = function (config, filepath, cb) {
  var dirname = getSitePathFromSiteConf(config);
  var fullpath = path.join(dirname, filepath);
  // sails.log.debug("site", site, "dirname", dirname, "fullpath", fullpath);
  if(fs.existsSync(fullpath)) {
    if(cb) return cb(null, dirname);
    return dirname;
  } else {
    var err = "[MultisiteService.getSiteDirname] File not found in site assets dirname: "+fullpath;
    // sails.log.debug(err, dirname);
    if(cb) return cb(err);
    return null;
  }
};

/**
 * Get site dirname from host.
 */
var getSiteDirname = function (host, filepath, cb) {
  // sails.log.debug("host", host, "filepath", filepath);
  // var config = MultisiteService.getCurrentSiteConfig(host);

  MultisiteService.getCurrentSiteConfig(host, function (err, config) {
    if(err) {
      var errMessage = "[MultisiteService.getSiteDirname] No site for host defined: "+host;
      return cb(err+errMessage, null);
    }
    getSiteDirnameFromSiteConf(config, filepath, cb);
  });
};

/**
 * The following functions are public
 */
module.exports = {
  find: find,
  findNames: findNames,
  findHosts: findHosts,
  getSitePathFromSiteConf: getSitePathFromSiteConf,
  getSiteDirnameFromSiteConf: getSiteDirnameFromSiteConf,
  getCurrentSiteConfig: getCurrentSiteConfig,
  getSiteConfigByName: getSiteConfigByName,
  getFallbackDirname: getFallbackDirname,
  getSiteDirname: getSiteDirname
};