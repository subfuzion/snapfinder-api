
/*
 * GET home page.
 */

exports.list = function(req, res){
  res.render('about', { title: 'SNAP Locator API' });
};
