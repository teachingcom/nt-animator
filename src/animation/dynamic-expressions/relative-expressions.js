import * as mappings from '../mappings'

class BaseRelativeTo {
  constructor (prop, args) {
    this.mapping = mappings.lookup(prop)

    // gather arguments
    this.isVisibility = prop === 'visible'
    this.flip = args.indexOf('flip') > -1
    this.toInt = args.indexOf('int') > -1
    this.clamp = args.indexOf('clamp') > -1
    this.min = args[0]
    this.max = args[1]
  }

  calculate (target, at, relativeTo) {
    // calculate the percent
    let percent

    // flips at center
    if (this.flip) {
      const mid = relativeTo / 2
      percent = Math.abs((at - mid) / mid)

    // full range
    } else {
      percent = at / relativeTo
    }

    // also clamp
    if (this.clamp) {
      percent = Math.max(-1, Math.min(1, percent))
    }

    // specials
    if (this.isVisibility) {
      target.visible = percent > this.min && percent < this.max
      return
    }

    let value = ((this.max - this.min) * percent) + this.min
    if (!isFinite(value) || isNaN(value)) {
      return
    }

    // assign the value
    this.mapping(target, this.toInt ? 0 | value : value)
  }
}

export class RelativeToX extends BaseRelativeTo {
  update = (target, stage) => {
    const bounds = target.getBounds()
    this.calculate(target, bounds.x, stage.width)
  }
}

export class RelativeToY extends BaseRelativeTo {
  update = (target, stage) => {
    const bounds = target.getBounds()
    this.calculate(target, bounds.y, stage.height)
  }
}

// // extract args
// export function getRelativeArgs(args) {
//   let [min, max] = args;
//   const param1 = args[2];
//   const param2 = args[3];
//   const flip = param1 === 'flip' || param2 === 'flip';
//   const toInt = param1 === 'int' || param2 === 'int';
//   return [min, max, flip, toInt]
// }

// // value is relative to the x position on screen
// export function relativeX(obj, stage, prop, ...args) {
//   const bounds = obj.getBounds();
//   calculateRelative(obj, prop, args, bounds.x, stage.width);
// }

// // value is relative to the x position on screen
// export function relativeY(obj, stage, prop, ...args) {
//   const bounds = obj.getBounds();
//   calculateRelative(obj, prop, args, bounds.y, stage.height);
// }

// // calculates a relative position from bounds and a relative value
// function calculateRelative(obj, prop, args, at, relativeTo) {
//   const [min, max, flip, toInt] = getRelativeArgs(args);

//   // calculate the percent
//   let percent;

//   // flips at center
//   if (flip) {
//     const cx = relativeTo / 2;
//     percent = Math.abs((at - cx) / cx);
//   }
//   // full range
//   else {
//     percent = at / relativeTo;
//   }

//   // specials
//   if (prop === 'visible') {
//     obj.visible = percent > min && percent < max;
//     return;
//   }
  
//   const value = ((max - min) * percent) + min;
//   if (!isFinite(value) || isNaN(value)) return;
  
//   // assign the value
//   const mapping = mappings.lookup(prop);
//   mapping(obj, toInt ? 0 | value : value);
// }