// import { PIXI as libPIXI } from '../../pixi/lib';

// // These do not work for some reason
// libPIXI.utils.skipHello();
// libPIXI.utils._saidHello = true;

// // HACK: inspect messages and disregard first pixi message
// // this will replace the very first message related to pixi
// // and then revert to normal use
// const _log = console.log;
// console.log = (...args) => {
// 	const [ msg ] = args;
	
// 	// if this is the hello message - cancel it
// 	if (/pixijs/i.test(msg)) {
// 		console.log = _log;
// 		return;
// 	}

// 	// use log normally
// 	_log.apply(console, args);
// };
