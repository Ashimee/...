(function () {
  /**
   * Clamp Extension API - BETA 1.5
   * @author Ashimee {https://github.com/Ashimee}
   */
  const soup_ =
    '!#%()*+,-./:;=?@[]^_`{|}~' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  window.Blockly = Clamp.Blockly;
  var hasOwn = (obj, key) => Object.prototype.hasOwnProperty(obj, key);
  Clamp.NVER = 1.5;
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
          categoryXML.push(_svl.blkXML(block));
        }
        categoryXML.push('</category>');
        Clamp.ExtAPI._pushCategory(categoryXML.join(''));
      },
    };

  Clamp.State.getTargetByName = (NAME) =>
    Clamp.State.currentProject.characters.find(
      (character) => character.name === NAME,
    );
})();

// oh yeah we got an api but its shit cause i made it 👍
(function (Cap) {
  const DO_VER = 1.5;

  if (!Cap || Cap?.VERSION < DO_VER) {
    console.error(
      `Extension API is missing or outdated.\nPlease use version ${DO_VER} if possible!`,
    );
    return -1;
  }
  if (Cap.VERSION > DO_VER)
    console.warn(
      `Extension API is recommended to be version ${DO_VER} for this extension.\nNewer versions may have updated / removed features, which may cause uninteded side effects.`,
    );

  const {
    compileVars,
    javascriptGenerator,
    canvas,
    State,
  } = window.Clamp;

  const preIntDat = '\nif(character)character.overlay = character?.overlay ?? {};\n';
  const ifFound = (NAME) => `\nif (character.overlay.hasOwnProperty(${NAME}))`;

  Cap.register({
    id: '0znzwEzOverlay',
    name: "Video",
    color1: '#B2268C',
    color2: '#B22546',
    color3: '#B22546',
    blocks: [
      {
        opcode: 'add',
        text: 'add overlay html %1 name %2',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'HTML',
            check: 'String',
            text: '<h1>Clamp!</h1>',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my video',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'adds an overlay',
      },
      {
        opcode: 'remove',
        text: 'remove overlay %1',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my video',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'removes an overlay',
      },
      {
        opcode: 'show',
        text: 'show overlay %1',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my video',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'shows an overlay',
      },
      {
        opcode: 'hide',
        text: 'hide overlay %1',
        previousStatement: null,
        nextStatement: null,
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my video',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'hides an overlay',
      },
      {
        opcode: 'has',
        text: 'overlay %1 exists?',
        output: ['Boolean'],
        arguments: [
          {
            type: 'field_input',
            name: 'NAME',
            check: 'String',
            text: 'my video',
            spellcheck: false,
            value: '',
            acceptsBlocks: true,
          },
        ],
        tooltip: 'retruns if an overlay with the inputted name is found',
      },
    ],
    generators: {
      has(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return [
          `((character?.overlay??{}).hasOwnProperty(${NAME}))`,
          Clamp.javascriptGenerator.ORDER_NONE,
        ];
      },
      add(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const HTML = javascriptGenerator.valueToCode(
          block,
          'HTML',
          javascriptGenerator.ORDER_ATOMIC,
        );
        const overlay = `character.overlay[${NAME}]`;
        return `${preIntDat}${ifFound(NAME)} ${overlay}.remove(); ${overlay} = document.createElement('span'); ${overlay}.id = 'overlay__id_'+${NAME}; ${overlay}.style.color = 'black'; ${overlay}.innerHTML = String(${HTML}); Clamp.canvas.appendChild(${overlay});`;
      },
      remove(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `${preIntDat}${ifFound(NAME)} character.overlay[${NAME}].remove();`;
      },
      hide(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `${preIntDat}${ifFound(NAME)} character.overlay[${NAME}].style.display = 'none';`;
      },
      show(block) {
        const NAME = javascriptGenerator.valueToCode(
          block,
          'NAME',
          javascriptGenerator.ORDER_ATOMIC,
        );
        return `${preIntDat}${ifFound(NAME)} character.overlay[${NAME}].style.display = '';`;
      },
    }
  });
  Clamp.enableLogOutput();
  return 1;
})(Clamp?.ExtAPI);
