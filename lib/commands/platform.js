/**
 * Created by alexkan on 2017/2/8.
 */

import _ from 'lodash';
import qs from 'querystring';
import log from '../logger';
import http from 'http';

const PLATFORM_COMMANDS = {
    ScreenShot:{Method:"POST",Route:"snapshot"}
};

//platform helper
class PlatformHelper {
    constructor(platformip, platformport) {
        //super();
        this.platformIp = platformip;
        this.platformPort = platformport;
    }

    checkResponse(res) {
        if (res === undefined || res.length ==0){
            throw new Error(`platform return nothing`);
        }
        // convert json string to object
        log.debug(`check platform response ${res}`);
        let result = JSON.parse(res);
        if (result.result == 0){
            if (result.data === undefined){
                return true;
            }else{
                return result.data;
            }
        }else{
            throw new Error(`platform 500 error: ${result.data}`);
        }
    }

    requestPlatform(command, params, platformIp, platformPort) {
        return new Promise(function (resolve, reject){
            let options = {
                host:platformIp,
                port:platformPort,
                path:"/"+command.Route,
                method:command.Method
            };
            let data = qs.stringify(params);
            if (command.Method === "GET" && data.length>0){
                options.path += "?"+data;
            }
            let body = "";
            let request = http.request(options, function(response) {
                response.on('data', function (chunk) {
                    body += chunk;
                });
                //On end of the request, run what we need to
                response.on('end',function() {
                    //Do Something with the data
                    resolve(body);
                });
            });
            request.on('error', function(e) {
                log.warn('problem with request: ' + e.message);
                let result = {result:-1,data:e.message};
                resolve(JSON.stringify(result));
            });
            if (command.Method === "POST" && data.length>0){
                request.write(postdata);
            }
            request.end();
        });
    }

    async executCommand(command, params){
        let res = await this.requestPlatform(command, params, this.platformIp, this.platformPort);
        let result = this.checkResponse(res);
        return result;
    }

    // use platform screenshot api
    async takeScreenshot(){
        let result = await this.executCommand(PLATFORM_COMMANDS.ScreenShot, "");
        return result;
    }
}

// check wether run on wetest platform
let isOnPlatform = process.env.PLATFORM_IP == undefined ? false:true;

let _platformHelper = undefined;
let WetestHelper = {};
// get PlatformExcutor
WetestHelper.getPlatformHelper = function(){
    if (!isOnPlatform){
        return undefined;
    }
    if (_platformHelper == undefined){
        let platformip = process.env.PLATFORM_IP ? process.env.PLATFORM_IP:"127.0.0.1";
        let platformport = process.env.PLATFORM_PORT ? process.env.PLATFORM_PORT:"3000";
        log.debug(`PlatformIP: ${platformip} PlatformPort: ${platformport}`);
        _platformHelper = new PlatformHelper(platformip, platformport);
    }
    return _platformHelper;
}

export {isOnPlatform, WetestHelper};
export default WetestHelper;