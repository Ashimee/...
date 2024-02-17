(function (Scratch) {
  'use strict';

  const vm = Scratch.vm, runtime = vm.runtime;
  const bcfi = runtime._buildCustomFieldInfo.bind(runtime);
  const bcftfsb = runtime._buildCustomFieldTypeForScratchBlocks.bind(runtime);
  let fi = null;
  runtime._buildCustomFieldInfo = function(fieldName, fieldInfo, extensionId, categoryInfo) {
    fi = fieldInfo;
    return bcfi(fieldName, fieldInfo, extensionId, categoryInfo);
  }
  runtime._buildCustomFieldTypeForScratchBlocks = function(fieldName, output, outputShape, categoryInfo) {
    let res = bcftfsb(fieldName, output, outputShape, categoryInfo);
    if (fi) {
      if (fi.color1) res.json.colour = fi.color1;
      if (fi.color2) res.json.colourSecondary = fi.color2;
      if (fi.color3) res.json.colourTertiary = fi.color3;
      fi = null;
    }
    return res;
  }

  // https://github.com/LLK/scratch-vm/blob/f405e59d01a8f9c0e3e986fb5276667a8a3c7d40/test/unit/extension_conversion.js#L85-L124
  // https://github.com/LLK/scratch-vm/commit/ceaa3c7857b79459ccd1b14d548528e4511209e7
  vm.addListener('EXTENSION_FIELD_ADDED', fieldInfo => {
    ScratchBlocks.Field.register(fieldInfo.name, fieldInfo.implementation);
  });

  vm.on('EXTENSION_ADDED', tryUseScratchBlocks);
  vm.on('BLOCKSINFO_UPDATE', tryUseScratchBlocks);
  vm.on('workspaceUpdate', tryUseScratchBlocks);
  tryUseScratchBlocks();

  function tryUseScratchBlocks() {
    if (!ScratchBlocks.Colours.buttonActiveBackground) {
      throw new Error('The VM is outdated!');
    }

    if (!window.ScratchBlocks) return;

    const workspace = ScratchBlocks.getMainWorkspace();
    vm.removeListener('EXTENSION_ADDED', tryUseScratchBlocks);
    vm.removeListener('BLOCKSINFO_UPDATE', tryUseScratchBlocks);
    vm.removeListener('workspaceUpdate', tryUseScratchBlocks);

    console.log('successfully found scratchblocks');

    const SBC = ScratchBlocks.Connection;
    const SBCP = SBC.prototype;
    const ccwr_ = SBCP.canConnectWithReason_;
    SBCP.canConnectWithReason_ = function(target) {
      const res = ccwr_.call(this, target);
      if (target?.isSquare && this.sourceBlock_.outputShape_ !== ScratchBlocks.OUTPUT_SHAPE_SQUARE) return SBC.REASON_WRONG_TYPE;
      return res;
    }

    ScratchBlocks.Workspace.prototype.getBlocksByType = function (type) {
      return this.getAllBlocks().filter((block) => block.type == type);
    };

    function fixBlocks() {
      workspace.getBlocksByType('0znzwSquareOnlyMenu_menu_idk').forEach((shadow) => {
        shadow.setOutputShape(3);
        shadow.render();
        shadow.outputConnection.targetConnection.isSquare = true;
      });
    }

    vm.runtime.addListener('BLOCK_DRAG_UPDATE', fixBlocks);
    vm.on('workspaceUpdate', fixBlocks);
  }

  class SquareMenu extends ScratchBlocks.FieldDropdown {
    constructor(menuGenerator, opt_validator) {
      let mg;
      if (Array.isArray(menuGenerator)) menuGenerator.push('square override');
      if (typeof menuGenerator === 'function') {
        mg = menuGenerator;
        menuGenerator = function(...args) {
          const items = mg(...args);
          if (Array.isArray(items)) items.push('square override');
          return items;
        }
      }
      super(menuGenerator, opt_validator);
    }
  }

  class SqrMenuExt {
    getInfo() {
      return {
        id: '0znzwSquareOnlyMenu',
        name: 'Test',
        blocks: [
          {
            opcode: 'block',
            blockType: Scratch.BlockType.COMMAND,
            text: '[idk] menu',
            disableMonitor: true,
            arguments: {
              idk: {
                type: 'SquareMenu',
                menu: 'idk'
              }
            }
          },
          {
            opcode: 'square', output: null, outputShape: 3,
            blockType: Scratch.BlockType.REPORTER,
            text: 'square'
          },
        ],
        menus: {
          idk: {
            acceptReporters: true,
            items: ['only squares']
          },
        },
        customFieldTypes: {
          SquareMenu: {
            output: 'String',
            outputShape: 3,
            implementation: {
              fromJson: () => new SquareMenu()
            }
          }
        }
      };
    }

    block(args) {
    }
    square() {
    }
  }

  const cbfsb = runtime._convertBlockForScratchBlocks.bind(runtime);
  runtime._convertBlockForScratchBlocks = function (blockInfo, categoryInfo) {
    const res = cbfsb(blockInfo, categoryInfo);
    if (blockInfo.outputShape) res.json.outputShape = blockInfo.outputShape;
    if (blockInfo.output) res.json.output = blockInfo.output;
    return res;
  };

  Scratch.extensions.register(new SqrMenuExt());
})(Scratch);
