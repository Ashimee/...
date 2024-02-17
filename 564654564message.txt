(function(vm) {

  const xmlEscape = function (unsafe) {
    if (typeof unsafe !== 'string') {
      if (Array.isArray(unsafe)) {
        unsafe = String(unsafe);
      } else {
        return unsafe;
      }
    }
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  const runtime = vm.runtime;
  const visualReportOg = runtime.visualReport.bind(runtime);

  const visualReportConfirm = function(id, confirm, report) {
  if (!window?.ScratchBlocks) return;
    const Blockly = ScratchBlocks;
    const workspace = Blockly.getMainWorkspace();
    var block = workspace.getBlockById(id);
    if (!block) {
      throw 'Tried to report value on block that does not exist.';
    }
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    var contentDiv = Blockly.DropDownDiv.getContentDiv();
    var valueReportBox = document.createElement('div');
    var yesNoDiv = document.createElement('div');
    var separator = document.createElement('span');
    valueReportBox.innerHTML = xmlEscape(confirm).replaceAll('\n', '<br>');
    var yes = document.createElement('span');
    var no = document.createElement('span');
    yes.textContent = 'yes';
    yes.style['text-shadow'] = '#00FF00 1px 0 10px';
    no.textContent = 'no';
    no.style['text-shadow'] = '#FF0000 1px 0 10px';
    separator.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
    yesNoDiv.appendChild(yes);
    yesNoDiv.appendChild(separator);
    yesNoDiv.appendChild(no);
    yes.onclick = () => {
      Blockly.DropDownDiv.hide();
      visualReportOg(id, report);
    }
    no.onclick = () => {
      Blockly.DropDownDiv.hide();
    }
    valueReportBox.appendChild(yesNoDiv);
    contentDiv.appendChild(valueReportBox);
    Blockly.DropDownDiv.setColour(Blockly.Colours.valueReportBackground, Blockly.Colours.valueReportBorder);
    Blockly.DropDownDiv.showPositionedByBlock(workspace, block);
  }

  runtime.visualReport = function(blockId, text) {
    if (text.length > 100) {
      return visualReportConfirm(blockId, 'This text is long and may crash your tab, causing lost progress.\nAre you sure you want to do this?\n', text);
    }
    return visualReportOg(blockId, text);
  }

})(vm);