const Q = require('q')
const debug = require('./debug')
const logger = require('./log')(__filename);

function $call(registry, fn, ...args){
    let deferred = Q.defer();
    try {
        logger.info(`Calling registry.${fn} with args: ${args}`);
        registry[fn](...args, function(err) {
            if (err) {
                logger.error(err);
                debug(err)
                deferred.reject(new Error(err))
            } else {
                logger.info("Succeeded");
                let result = Array.prototype.splice.apply(arguments, [1])
                deferred.resolve(...result)
            }
        })
    } catch (e) {
        logger.error(`Sync error: ${e}`);
        throw e;
    }
    return deferred.promise
}

exports.$create = function(registry, ...args) {
    logger.info("$create", registry.hive, registry.key, args);
    return $call(registry, 'create', ...args)
}

exports.$set = function(registry, ...args) {
    logger.info("$set", registry.hive, registry.key, args);
    return $call(registry, 'set', ...args)
}

exports.$destroy = function(registry, ...args) {
    logger.info("$destroy", registry.hive, registry.key, args);
    return $call(registry, 'destroy', ...args)
}
