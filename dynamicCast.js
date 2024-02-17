// Name: Cast
// ID: lmsCast
// Description: Convert values between types.
// By: LilyMakesThings <https://scratch.mit.edu/users/LilyMakesThings/>
// var ws = ScratchBlocks.getMainWorkspace(), block = ws.getBlockById('2q8_N=)SAhM9J$-P[czt');

(function (Scratch) {
  'use strict';

  const Cast = Scratch.Cast;

  vm.on('EXTENSION_ADDED', tryUseScratchBlocks);
  vm.on('BLOCKSINFO_UPDATE', tryUseScratchBlocks);
  tryUseScratchBlocks();

  function tryUseScratchBlocks() {
    if (!ScratchBlocks.Colours.buttonActiveBackground) {
      throw new Error('The VM is outdated!');
    }

    if (!window.ScratchBlocks) return;

    const workspace = ScratchBlocks.getMainWorkspace();
    vm.removeListener('EXTENSION_ADDED', tryUseScratchBlocks);
    vm.removeListener('BLOCKSINFO_UPDATE', tryUseScratchBlocks);

    console.log('successfully found scratchblocks');

    ScratchBlocks.BlockSvg.prototype.getPlacedInput = function () {
      if (!this.parentBlock_) return;
      return this.parentBlock_.getInputWithBlock(this);
    };
    ScratchBlocks.BlockSvg.prototype.renderAsInputType = function (failSafe) {
      var input = this.getPlacedInput();
      if (input) this.setOutputShape(input.type);
      else this.setOutputShape(failSafe);
      this.render();
    };
    ScratchBlocks.BlockSvg.prototype.renderAsInputCheck = function (failSafe) {
      var input = this.getPlacedInput(),
        checks = input?.connection?.check_ ?? [],
        shape = failSafe;
      if (checks.includes('Boolean')) shape = ScratchBlocks.OUTPUT_SHAPE_HEXAGONAL;
      if (input) this.setOutputShape(shape);
      else this.setOutputShape(failSafe);
      this.render();
    };
    ScratchBlocks.Workspace.prototype.getBlocksByType = function (type) {
      return this.getAllBlocks().filter((block) => block.type == type);
    };

    vm.runtime.addListener('BLOCK_DRAG_UPDATE', () => {
      workspace.getBlocksByType('lmsCast_toType').forEach((block) => {
        block.renderAsInputCheck(ScratchBlocks.OUTPUT_SHAPE_ROUND);
      });
    });
  }

  class CastUtil {
    getInfo() {
      return {
        id: 'lmsCast',
        name: 'Cast',
        blocks: [
          {
            opcode: 'toType',
            blockType: Scratch.BlockType.REPORTER,
            text: 'cast [INPUT] to [TYPE]',
            allowDropAnywhere: true,
            disableMonitor: true,
            arguments: {
              INPUT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'apple',
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'type',
              },
            },
          },
          {
            opcode: 'typeOf',
            blockType: Scratch.BlockType.REPORTER,
            text: 'type of [INPUT]',
            disableMonitor: true,
            arguments: {
              INPUT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'apple',
              },
            },
          },
        ],
        menus: {
          type: {
            acceptReporters: true,
            items: ['number', 'string', 'boolean', 'default'],
          },
        },
      };
    }

    toType(args) {
      const input = args.INPUT;
      switch (args.TYPE) {
        case 'number':
          return Cast.toNumber(input);
        case 'string':
          return Cast.toString(input);
        case 'boolean':
          return Cast.toBoolean(input);
        default:
          return input;
      }
    }

    typeOf(args) {
      const input = args.INPUT;
      switch (typeof input) {
        case 'number':
          return 'number';
        case 'string':
          return 'string';
        case 'boolean':
          return 'boolean';
        default:
          return '';
      }
    }
  }

  Scratch.extensions.register(new CastUtil());
})(Scratch);
