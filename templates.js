var glob = ('undefined' === typeof window) ? global : window,

Handlebars = glob.Handlebars || require('handlebars');

this["templates"] = this["templates"] || {};

this["templates"]["code"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "\r\n<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <title>Title of the document</title>\r\n</head>\r\n\r\n    <body class=\"container\">\r\n        <form method=\"post\" action=\"/requestAccess\">\r\n            <input type=\"hidden\" name=\"next\"  value=\"";
  if (stack1 = helpers.next) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.next); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\r\n			<input type=\"hidden\" name=\"error\" value=\"";
  if (stack1 = helpers.error) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.error); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\r\n			<input type=\"hidden\" name=\"client_id\" value=\"";
  if (stack1 = helpers.client) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.client); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\r\n\r\n            <label>";
  if (stack1 = helpers.client) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.client); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + " is requesting Access to your ish</label>\r\n            <button value=\"true\"  name=\"decision\">accept</button>\r\n            <button value=\"false\" name=\"decision\">deny</button>\r\n        </form>\r\n    </body>\r\n</html>";
  return buffer;
  });

this["templates"]["login"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "\r\n<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <title>Title of the document</title>\r\n</head>\r\n\r\n    <body class=\"container\">\r\n        <form method=\"post\" action=\"/login\">\r\n            <input type=\"hidden\" name=\"next\" value=\"";
  if (stack1 = helpers.next) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.next); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\r\n            \r\n            <label>Username</label>\r\n            <input type=\"text\" name=\"username\">\r\n\r\n            <label>Password</label>\r\n            <input type=\"password\"  name=\"password\">\r\n\r\n            <button>Submit</button>\r\n        </form>\r\n    </body>\r\n</html>";
  return buffer;
  });

if (typeof exports === 'object' && exports) {module.exports = this["templates"];}