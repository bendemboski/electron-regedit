'use strict';

const Registry = require('winreg')
const path = require('path')
const {app} = require('electron')
const Q = require('q')

const {$create, $set, $destroy} = require('./util')
const ShellOption = require('./shelloption')
const Regedit = require('./regedit')
const debug = require('./debug')
const logger = require('./log')(__filename);

function ProgId({
    progExt = '',
    appName = app.getName(),
    description = undefined,
    friendlyAppName = undefined,
    hive = Registry.HKCU,
    squirrel = false,
    icon,
    shell = [],
    extensions = []
}) {
    this.progId = progExt ? `${appName}.${progExt}` : `${appName}`
    this.appName = appName
    this.description = description
    this.hive = hive
    this.icon = icon
    this.squirrel = squirrel
    this.friendlyAppName = friendlyAppName
    this.extensions = extensions
    logger.info(`Extensions: ${extensions.length} ${extensions}`);
    this.shell = bindShells(this, shell)
    this.BASE_KEY = `\\Software\\Classes\\${this.appName}`
    Regedit.add(this)
}

function bindShells(prog, shell) {
    if (Array.isArray(shell) && shell.length === 0) {
        shell.push(new ShellOption({}))
    }

    return shell.map((s) => s.bindProg(prog))
}

ProgId.prototype.uninstall = function () {
    if(process.platform !== 'win32') {
        return false;
    }

    let self = this

    let registry = new Registry({
        hive: this.hive,
        key: this.BASE_KEY
    })

    return $destroy(registry)
};

ProgId.prototype.install = function () {
    logger.info('Installing');
    if(process.platform !== 'win32') {
        return false;
    }

    let self = this

    let registry = new Registry({
        hive: this.hive,
        key: this.BASE_KEY
    })

    return $create(registry)
        .then(() => registerDescription())
        .then(() => registerIcon())
        .then(() => registerShellCommands())
        .then(() => registerFileAssociations())
        .then(() => debug(`Installed registry "${this.progId}" sucessfully`))

    function registerDescription() {
        logger.info(`Description: ${self.description}`);
        if (!self.description) return
        return $set(registry, Registry.DEFAULT_VALUE, Registry.REG_SZ, self.description)
    }

    function registerIcon() {
        logger.info(`Icon: ${self.icon}`);
        if (!self.icon) return

        let iconPath
        if (path.isAbsolute(self.icon)) {
            iconPath = self.icon
        } else {
            iconPath = path.join(process.execPath, '..', self.icon)
        }

        let defaultIcon = new Registry({
            hive: self.hive,
            key: `${self.BASE_KEY}\\DefaultIcon`
        })

        return $create(defaultIcon)
            .then(() => $set(defaultIcon, Registry.DEFAULT_VALUE, Registry.REG_SZ, iconPath))
    }

    function registerShellCommands() {
        logger.info(`Shell commands: ${self.shell}`);
        let shells = self.shell.map(shell => shell.install())
        return Q.all(shells)
    }

    function registerFileAssociations() {
        logger.info(`File associations: ${self.extensions}`);
        let extensions = self.extensions.map((ext) => registerFileExtension(ext))
        return Q.all(extensions)
    }

    function registerFileExtension(ext) {
        logger.info(`File extension: ${ext}`);
        let registry = new Registry({
            hive: self.hive,
            key: `\\Software\\Classes\\.${ext}\\OpenWithProgids`
        })

        return $create(registry).then(() =>
            $set(registry, self.progId, Registry.REG_SZ, '')
        )
    }
};

module.exports = ProgId
