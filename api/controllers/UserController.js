/**
 * UserController
 * A set of functions called `actions`.
 * Actions contain code telling Sails how to respond to a certain type of request.
 * (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 * You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 * /or override them with custom routes (`config/routes.js`)
 *
 * NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @see http://sailsjs.org/#!documentation/controllers
 */

/**
 * Setup the admin user for the current site
 *
 * WARN: This function removes all existing users for site and hust add the default admin user with the default password.
 */
var setup = function (req, res, next) {
  // get the current site this setup was called
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) return res.serverError(err);
    SetupService.generateUsers(config.name, function(err, result) {
      if(err) return res.serverError(err);
      result.site = config.name;
      sails.log.debug("done");
      res.json(result);
    });
  });
};

/**
 * 
 */
var update = function (req, res, next) {
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    var id = req.param('id');
    var data = req.params.all();
    data.site = config.name;
    User.update({id:id},data).exec(function update(error, updated){
      if(error) return res.serverError(error);
      User.publishUpdate(updated[0].id, updated[0]);
      res.json(updated);
    });
  });
};

/**
 * 
 */
var destroy = function(req, res) {
  var id = req.param('id');
  User.destroy(id, function (error, destroyed) {
    if(error) return res.serverError(error);
    User.publishDestroy(id);
    sails.log.debug(destroyed);
    res.ok();
  });
};

/**
 * 
 */
var create = function(req, res) {
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { 
      sails.log.error("[controllers/UserController.js]", err);
      return res.serverError(err);
    }
    var data = req.params.all();
    data.site = config.name;
    User.create(data, function (error, created) {
      if(error) {
        sails.log.error("[controllers/UserController.js]", error);
        return res.serverError(error);
      }
      User.publishCreate(created);
      sails.log.debug(created);
      res.ok();
    });
  });
};

/**
 * 
 */
var find = function (req, res) {
  var query;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    query = {
      where: {
        site: config.name
      }
    };
    User.find(query).exec(function found(err, found) {
      if (err) return res.serverError(err);
      // not found
      if (UtilityService.isUndefined(found) || !UtilityService.isArray(found)) {
        res.notFound(query.where);
      } else {
        sails.log.debug("found", found);
        res.json(found);
      }
    });
  });
};

/**
 * find themes for any passed host from database and isert priority from database (or from local.json if no priority is set).
 * Only for superadmins!
 */
var findByHost = function (req, res, next) {
  var host = req.param('host');
  // sails.log.debug("[ThemeController.findByHost]", host);
  UserService.find(host, {}, function found(err, found) {
    if (err) return res.serverError(err);
    res.json(found);
  });
}

/**
 * Update or create route (eg. position) for any passed host.
 * Only for superadmins!
 *
 * @param req.param.host Host to save route for
 */
var updateOrCreateByHost = function (req, res, next) {
  var data = req.params.all();
  var host = data.host;
  delete data.host;
  sails.log.debug("[UserController.updateOrCreateByHost]", host, data);
  UserService.updateOrCreate(host, data.user, function (err, result) {
    if(err) return res.serverError(err);
    sails.log.debug("[UserController.updateOrCreateByHost]", "result", result);
    return res.json(result);
  });
}

/**
 * 
 */
module.exports = {
  setup:setup,
  update:update,
  destroy:destroy,
  create:create,
  find:find,
  findByHost:findByHost,
  updateOrCreateByHost: updateOrCreateByHost
};
