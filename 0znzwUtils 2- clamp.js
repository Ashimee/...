(function () {
  /**
   * Clamp Extension API - BETA 1.7
   * @author Ashimee {https://github.com/Ashimee}
   */
  const soup_ =
    '!#%()*+,-./:;=?@[]^_`{|}~' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  window.Blockly = Clamp.Blockly;
  var hasOwn = (obj, key) => Object.prototype.hasOwnProperty(obj, key);
  Clamp.NVER = 1.7;
  if (!Clamp?.ExtAPI || Clamp.ExtAPI.VERSION > Clamp.NVER)
    Clamp.ExtAPI = {
      VERSION: Clamp.NVER,
      refreshToolbox(toolboxXML) {
        const workspace = Clamp.getWorkspace();
        Clamp.Toolbox = toolboxXML ?? Clamp.Toolbox;
        workspace.updateToolbox(Clamp.Toolbox);
        workspace.refreshToolboxSelection();
      },
      _pushCategory(xml) {
        let toolboxXML = Clamp.Toolbox;
        toolboxXML = toolboxXML.replace('</xml>', `\n${xml}\n</xml>`);
        Clamp.ExtAPI.refreshToolbox(toolboxXML);
        Clamp.getWorkspace().refreshTheme();
      },
      _copyBlkAttr(obj, old, new_) {
        obj[new_] = obj[old];
        delete obj[old];
        return obj;
      },
      _repCategory(name, newXML) {
        const doc = new DOMParser()
          .parseFromString(Clamp.Toolbox, 'text/html')
          .querySelector('xml');
        doc.querySelector(
          `category[name="${name.replaceAll('\\', '\\\\').replaceAll('"', '"')}"]`,
        ).outerHTML = newXML;
        return doc.outerHTML;
      },
      xmlEscape(unsafe) {
        return String(unsafe).replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case '<':
              return '&lt;';
            case '>':
              return '&gt;';
            case '&':
              return '&amp;';
            case "'":
              return '&apos;';
            case '"':
              return '&quot;';
          }
        });
      },

      /**
       * Generate a unique ID, from Blockly.  This should be globally unique.
       * 87 characters ^ 20 length > 128 bits (better than a UUID).
       * @return {string} A globally unique ID string.
       */
      uid() {
        const length = 20;
        const soupLength = soup_.length;
        const id = [];
        for (let i = 0; i < length; i++) {
          id[i] = soup_.charAt(Math.random() * soupLength);
        }
        return id.join('');
      },
      _svl: {
        genHeader(ei) {
          const xe = Clamp.ExtAPI.xmlEscape;
          let header =
            '<category name="%name" id="%id" colour="%c1" colourSecondary="%c2" colourTertiary="%c3">';
          header = header.replace('%name', xe(ei.name));
          header = header.replace('%id', xe(ei.name));
          header = header.replace('%c1', xe(ei.color1));
          header = header.replace('%c2', xe(ei.color2 ?? ei.color1));
          header = header.replace('%c3', xe(ei.color3 ?? ei.color1));
          return header;
        },
        fixMsnBsArgs(block, ei) {
          block.fullOp = `clampExt_${ei.id}_${block.opcode}`;
          block.fullOpXML = Clamp.ExtAPI.xmlEscape(block.fullOp);
          block.gen = ei.generators[block.opcode];
          if (!hasOwn(block, 'colour')) block.colour = ei.color1;
          if (!hasOwn(block, 'inputsInline')) block.inputsInline = true;
          if (!hasOwn(block, 'args0')) block.args0 = [];
          return block;
        },
        blkXML(fmbaBlock) {
          return `    <block type="${Clamp.ExtAPI.xmlEscape(fmbaBlock.fullOp)}"></block>`;
        },
      },
      register(extensionInfo) {
        const API = Clamp.ExtAPI,
          _svl = API._svl;
        Clamp.DarkTheme.blockStyles = Clamp.DarkTheme.blockStyles ?? {};
        Clamp.DarkTheme.blockStyles[`clampExt_${extensionInfo.id}`] = {
          colourPrimary: extensionInfo.color1,
          colourSecondary: extensionInfo.color2 ?? extensionInfo.color1,
          colourTertiary: extensionInfo.color3 ?? extensionInfo.color1,
        };
        const categoryXML = [_svl.genHeader(extensionInfo)];
        for (let block of extensionInfo.blocks) {
          if (block.isXML) {
            if (typeof block.isXML === 'string') categoryXML.push(block.isXML);
            else categoryXML.push(String(block?.xml));
            continue;
          }
          block = _svl.fixMsnBsArgs(block, extensionInfo);
          block = API._copyBlkAttr(block, 'arguments', 'args0');
          block = API._copyBlkAttr(block, 'text', 'message0');
          Clamp.registerBlock(block.fullOp, block, block.gen);
          if (!block?.skipXMLpush) categoryXML.push(_svl.blkXML(block));
        }
        categoryXML.push('</category>');
        const finalXML = categoryXML.join('');
        if (!extensionInfo?.skipPush) Clamp.ExtAPI._pushCategory(finalXML);
        return finalXML;
      },
    };

  Clamp.State.getTargetByName = (NAME) =>
    Clamp.State.currentProject.characters.find(
      (character) => character.name === NAME,
    );
})();

// oh yeah we got an api but its shit cause i made it 👍
(function (Cap) {
  const DO_VER = 1.7;

  if (!Cap || Cap?.VERSION < DO_VER) {
    console.error(
      'Extension API is missing or outdated.\nPlease use version 1.3 if possible!',
    );
    return -1;
  }
  if (Cap.VERSION > DO_VER)
    console.warn(
      'Extension API is recommended to be version 1.3 for this extension.\nNewer versions may have updated / removed features, which may cause uninteded side effects.',
    );

  const {
    compileVars,
    javascriptGenerator,
    canvas,
    State,
    Precompile,
    Blockly,
  } = window.Clamp;
  const canvasRect = canvas.getBoundingClientRect();
  const Project = () => State.currentProject,
    EditTarget = () => State.getTargetById(State.editingTarget);
  window.__ashime = {
    setupVars() {
      Project().customData = Project()?.customData ?? {};
      Project().customData.ashimeVars = Project().customData?.ashimeVars ?? {};
    },
    getVars() {
      this.setupVars();
      return Project().customData.ashimeVars;
    },
    setVar(n, v) {
      this.setupVars();
      Project().customData.ashimeVars[n] = v;
    },
  };

  /* https://github.com/ClampProject/ClampCoding/blob/main/svelte-app/src/resources/blocks/repeats.js */
  const repeatDelayTime = 1000 / 60; // how much time before the next iteration in a loop
  const repeatDelayIfEnabled = () => {
    if (!Precompile.forceLoopPauses) return '';
    return `await new Promise(resolve => setTimeout(() => resolve(), ${repeatDelayTime}));`;
  };
  /* ------- */

  Cap.register({
    id: '0znzwUtils',
    name: "Ashime's utilities",
    color1: '#2F6AE3',
    color2: '#040f0b',
    color3: '#040f0b',
    blocks: [
      {
        opcode: 'stageWidth',
        text: 'stage width',
        output: ['Number'],
        tooltip: 'width of the stage (visual width not the internal width)',
      },
      {
        opcode: 'stageHeight',
        text: 'stage height',
        output: ['Number'],
        tooltip: 'height of the stage  (visual height not the internal height)',
      },
      {
        opcode: 'SETstageWidth',
        text: 'stage width to %1 (visually)',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_number',
            name: 'SIZE',
            check: 'Number',
            value: 480,
            acceptsBlocks: true,
          },
        ],
        tooltip: 'sets the width of the stage (visually, not internally)',
      },
      {
        opcode: 'SETstageHeight',
        text: 'set stage height to %1 (visually)',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_number',
            name: 'SIZE',
            check: 'Number',
            value: 360,
            acceptsBlocks: true,
          },
        ],
        tooltip: 'sets the height of the stage (visually, not internally)',
      },
      {
        opcode: 'STRcast',
        text: 'str %1',
        output: ['String'],
        arguments: [
          {
            type: 'field_input',
            name: 'castMe',
            check: null,
            text: 'stringggggg',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'converts the input into a string',
      },
      {
        opcode: 'NUMcast',
        text: 'num %1',
        output: ['Number'],
        arguments: [
          {
            type: 'field_number',
            name: 'castMe',
            check: null,
            value: 0,
            acceptsBlocks: true,
          },
        ],
        tooltip: 'converts the input into a number',
      },
      {
        opcode: 'BOOLcast',
        text: 'bool %1',
        output: ['Boolean'],
        arguments: [
          {
            type: 'field_input',
            name: 'castMe',
            check: null,
            text: '1',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'converts the input into a boolean',
      },
      {
        skipXMLpush: true,
        opcode: 'SAVEexists',
        text: 'variable %1 exists?',
        output: ['Boolean'],
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my variable',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'checks if a variable exists',
      },
      {
        skipXMLpush: true,
        opcode: 'SAVEget',
        text: 'get variable %1',
        output: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my variable',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'attempts to get a variable',
      },
      {
        skipXMLpush: true,
        opcode: 'SAVEset',
        text: 'set variable %1 to %2',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my variable',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
          {
            type: 'field_input',
            name: 'VALUE',
            check: null,
            text: '0',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'sets a variable to the inputted value',
      },
      {
        isXML: `<category name="Variables" colour="#2F6AE3" colourSecondary="#040f0b">
          <label text="(these save to the project file)" />
          <block type="clampExt_0znzwUtils_SAVEexists"></block>
          <block type="clampExt_0znzwUtils_SAVEget"></block>
          <block type="clampExt_0znzwUtils_SAVEset"></block>
        </category>`
      },
      {
        opcode: 'FORloop',
        text: 'for %1 = %2 to %3 %4 %5',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my variable',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
          {
            type: 'field_number',
            name: 'START',
            check: ['Number'],
            value: 0,
            acceptsBlocks: true,
          },
          {
            type: 'field_number',
            name: 'END',
            check: ['Number'],
            value: 10,
            acceptsBlocks: true,
          },
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'BLOCKS',
          },
        ],
        tooltip:
          'sets a variable to a value and goes up until it hits the end value (it will run the code)',
      },
      {
        opcode: 'LOOPcontinue',
        text: 'continue',
        previousStatement: null,
        tooltip:
          'skips the rest of the code and goes to the next iteration of the loop',
      },
      {
        opcode: 'LOOPbreak',
        text: 'break',
        previousStatement: null,
        tooltip: 'breaks out of the loop',
      },
      {
        opcode: 'INLINEcall',
        text: 'inline %1 %2',
        output: null,
        arguments: [
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'BLOCKS',
          },
        ],
        tooltip:
          'allows you to put blocks inside other blocks.\nuse "inline return" to return a value',
      },
      {
        opcode: 'INLINEreturn',
        text: 'inline return %1',
        previousStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'returnValue',
            check: null,
            text: '1',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'allows you to return a value for the inline block',
      },
      {
        opcode: 'COSTUMEset',
        text: 'set costume to %1',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: null,
            text: 'Apple',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'change the costume to the specified costume name',
      },
    ],
    generators: {
      stageWidth(block) {
        return [
          `(${parseFloat(canvasRect.width)})`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      stageHeight(block) {
        return [
          `(${parseFloat(canvasRect.height)})`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      SETstageWidth(block) {
        const SIZE = javascriptGenerator.valueToCode(
          block,
          'SIZE',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `\nClamp.canvas.width=${SIZE};Clamp.canvas.style.width=Clamp.canvas.width+'px';`;
      },
      SETstageHeight(block) {
        const SIZE = javascriptGenerator.valueToCode(
          block,
          'SIZE',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `\nClamp.canvas.height=${SIZE};Clamp.canvas.style.height=Clamp.canvas.height+'px';`;
      },
      STRcast(block) {
        const toCast = javascriptGenerator.valueToCode(
          block,
          'castMe',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [`String(${toCast})`, Clamp.javascriptGenerator.ORDER_NONE];
      },
      NUMcast(block) {
        const toCast = javascriptGenerator.valueToCode(
          block,
          'castMe',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [`Number(${toCast})`, Clamp.javascriptGenerator.ORDER_NONE];
      },
      BOOLcast(block) {
        const toCast = javascriptGenerator.valueToCode(
          block,
          'castMe',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [`Boolean(${toCast})`, Clamp.javascriptGenerator.ORDER_NONE];
      },
      SAVEexists(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [
          `(window.__ashime.getVars().hasOwnProperty(${NAME}))`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      SAVEget(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [
          `(window.__ashime.getVars()[${NAME}] ?? '')`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      SAVEset(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const VALUE = javascriptGenerator.valueToCode(
          block,
          'VALUE',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `window.__ashime.setVar(${NAME}, ${VALUE});`;
      },
      FORloop(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const START = javascriptGenerator.valueToCode(
          block,
          'START',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const END = javascriptGenerator.valueToCode(
          block,
          'END',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const BLOCKS = javascriptGenerator.statementToCode(block, 'BLOCKS');
        const varName = compileVars.next();
        return `\nwindow.__ashime.setVar(${NAME}, 0);for (let ${varName} = ${START}; ${varName} < ${END}+1; ${varName}++) {window.__ashime.setVar(${NAME}, ${varName}); \n ${BLOCKS} \n /* ${repeatDelayIfEnabled()} */ }`;
      },
      LOOPcontinue(block) {
        return `\ntry{continue;}catch{};`;
      },
      LOOPbreal(block) {
        return `\ntry{break;}catch{};`;
      },
      INLINEcall(block) {
        const BLOCKS = javascriptGenerator.statementToCode(block, 'BLOCKS');
        return [
          `\n((_ISINLINE)=>{\n${BLOCKS}\n})(true)\n`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      INLINEreturn(block) {
        const returnValue = javascriptGenerator.valueToCode(
          block,
          'returnValue',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `\nif(_ISINLINE)return ${returnValue};`;
      },
      COSTUMEset(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const imageId = compileVars.next();
        const engine = compileVars.next();
        return `\nvar ${engine} = character._engine, ${imageId} = Object.keys(${engine}.images).find(key => key.startsWith('_user_image_'+String(${NAME})));
                 character.currentImage = ${imageId};
                 character.updateCharacter();
                 character._element.src = ${engine}.images[${imageId}].src;`;
      },
    },
  });
  Clamp.enableLogOutput();
  return 1;
})(Clamp?.ExtAPI);
