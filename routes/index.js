
/*
 * GET home page.
 */

exports.list = function(req, res){
  res.render('index', { title: 'SNAP Locator API' });
};
