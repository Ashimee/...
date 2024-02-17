(function (Scratch) {
  'use strict';

  const vm = Scratch.vm, runtime = vm.runtime;

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
                menu: 'idk',
              }
            },
          },
          {
            opcode: 'square', output: null, outputShape: 3,
            blockType: Scratch.BlockType.REPORTER,
            text: 'square',
          },
        ],
        menus: {
          idk: {
            acceptReporters: true,
            items: ['only squares']
          },
        },
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
