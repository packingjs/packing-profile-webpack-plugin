var fs = require('fs');
var path = require('path');
var assign = require('object-assign');
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');
var NullFactory = require('webpack/lib/NullFactory');
var MissingProfileError = require('./MissingProfileError');

/**
 *
 * @param {object} Options object or obselete functionName string
 * @constructor
 * example: __('CDN_ROOT') or __('my.name')
 */
function ProfilePlugin(options) {
	var nodeEnv = process.env.NODE_ENV || 'production';
	this.options = assign({
		// profile文件名
		profile: `src/profiles/${nodeEnv}`,
		// 获取profile的方法名称
		functionName: '__',
		// 找不到值时是否中断webpack编译
		failOnMissing: false
	}, options);
}

module.exports = ProfilePlugin;

ProfilePlugin.prototype.apply = function(compiler) {
	var functionName = this.options.functionName;
	var failOnMissing = this.options.failOnMissing;
	var profileFile = path.isAbsolute(this.options.profile) ?
		this.options.profile :
		path.join(process.cwd(), this.options.profile);
	try {
		var profile = require(profileFile);
	} catch (e) {
		profile = {};
	}
	compiler.plugin('compilation', function(compilation, params) {
		compilation.dependencyFactories.set(ConstDependency, new NullFactory());
		compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
		params.normalModuleFactory.plugin("parser", function(parser, options) {
			parser.plugin('call ' + functionName, function(expr) {
					var param, defaultValue;
					switch(expr.arguments.length) {
					case 2:
						param = this.evaluateExpression(expr.arguments[1]);
						if(!param.isString()) return;
						param = param.string;
						defaultValue = this.evaluateExpression(expr.arguments[0]);
						if(!defaultValue.isString()) return;
						defaultValue = defaultValue.string;
						break;
					case 1:
						param = this.evaluateExpression(expr.arguments[0]);
						if(!param.isString()) return;
						defaultValue = param = param.string;
						break;
					default:
						return;
					}
					// Todo 异常处理
					var result = byString(profile, defaultValue);
					if (typeof result == 'undefined') {
						var error = this.state.module[__dirname];
						if (!error) {
							error = this.state.module[__dirname] = new MissingProfileError(this.state.module, param, defaultValue);
							if (failOnMissing) {
								this.state.module.errors.push(error);
							} else {
								this.state.module.warnings.push(error);
							}
						} else if(error.requests.indexOf(param) < 0) {
							error.add(param, defaultValue);
						}
						result = defaultValue;
					}
					var dep = new ConstDependency(JSON.stringify(result), expr.range);
					dep.loc = expr.loc;
					this.state.current.addDependency(dep);
					return true;
				});
		});
	});
};

/**
 *
 * @param {object}  localization
 * @param {string}  string key
 * @returns {*}
 */
function byString(object, stringKey) {
	stringKey = stringKey.replace(/^\./, ''); // strip a leading dot

	var keysArray = stringKey.split('.');
	for (var i = 0, length = keysArray.length; i < length; ++i) {
		var key = keysArray[i];

		console.log('--key:', key);
		console.log('--object:', object);

		if (key in object) {
			object = object[key];
		} else {
			return;
		}
	}

	return object;
}
