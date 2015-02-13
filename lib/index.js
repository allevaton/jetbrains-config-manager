/**
 * Created by Nick on 2/8/2015.
 */

var configList;
var ideList;
var editorPanel;

var discoveredConfigurations;
var currentConfig;

var aceEditor;
var aceEditorUndoManager;
var xmlMode;

function selectOnlyThis (me, element) {
    element.children().removeClass("active");
    $(me).addClass("active");
}

function loadingListItem (element) {
    element.empty()
        .append($("<a>")
            .attr("href", "javascript:void(0);")
            .addClass("list-group-item")
            .append($("<img>")
                .attr("src", "images/loader.gif"))
            .append("Loading..."));
}

function aceCheckClean () {
    if (aceEditorUndoManager.isClean()) {
        editorPanel.removeClass("panel-warning")
            .addClass("panel-default");
        $("#btn-reset").addClass("disabled");
        $("#btn-save").addClass("disabled");
        return true;
    }
    else {
        editorPanel.removeClass("panel-default")
            .addClass("panel-warning");
        $("#btn-reset").removeClass("disabled");
        $("#btn-save").removeClass("disabled");
        return false;
    }
}

function aceUndoAll () {
    while (aceEditorUndoManager.$undoStack.length > 0) {
        aceEditorUndoManager.undo();
    }
    aceEditorUndoManager.redo();
    aceEditorUndoManager.reset();
    aceEditorUndoManager.markClean();
}

function reloadSelections () {
    var oldConfigSelection = configList.find(".active").text();
    //ideList.find(".active").trigger("click");
    ideListClick(null, oldConfigSelection);
}

function ideListClick (event, triggerThisConfig) {
    if (triggerThisConfig === undefined) {
        selectOnlyThis(this, ideList);
        configList.parent().fadeIn();
        editorPanel.fadeOut();

        loadingListItem(configList);
    }

    var eventTarget = ideList.find(".active").text();

    // TODO find the .active one instead
    discoveredConfigurations.foundConfigs.forEach(function (e) {
        if (e.type === eventTarget) {
            $.ajax({
                url: "/api/getConfigOptions?type=" + e.type + "&location=" + e.location,
                cache: false,
                success: function (data) {
                    data = JSON.parse(data);
                    currentConfig = data;

                    configList.empty();

                    data.availableConfigs.forEach(function (e) {
                        var a = $("<a>")
                            .attr("href", "javascript:void(0);")
                            .addClass("list-group-item")
                            .click(configListClick)
                            .append(e.name)
                            .appendTo(configList);

                        if (e.name === triggerThisConfig)
                            a.trigger("click");
                    });
                },
                error: function (xhr, status, err) {
                    configList.html("Could not retrieve configurations from the server");
                    console.error(xhr, status, err);
                }
            });
        }
    });
}

function configListClick (event) {
    selectOnlyThis(this, configList);

    var config;
    var eventTarget = $(event.currentTarget).text();

    var dropDown = $("#file-dropdown");

    // TODO find the .active one instead
    currentConfig.availableConfigs.forEach(function (e) {
        if (e.name === eventTarget) {
            config = e;
        }
    });
    if (config === undefined) {
        configList.html("The IDE you selected was not found.");
        return;
    }

    dropDown.find("ul").empty();
    dropDown.find("button").text(config.files[0].name)
        .append('<span class="caret"/>')
        .attr("value", config.files[0].path);

    config.files.forEach(function (file) {
        $("<a>")
            .attr("href", "javascript:void(0);")
            .text(file.name)
            .click(changeFileDropDown)
            .appendTo($("<li>")
                .attr("value", file.path)
                .appendTo(dropDown
                    .find("ul")));
    });

    editorPanel.fadeIn();

    if (aceEditor === undefined) {
        aceEditor = ace.edit("ace-panel");

        xmlMode = require("ace/mode/xml").Mode;
        aceEditor.getSession().setMode(new xmlMode());

        aceEditorUndoManager = aceEditor.getSession().getUndoManager();
        aceEditor.$blockScrolling = Infinity;
    }

    aceEditor.on("change", aceCheckClean);

    dropDown.find("a").first().trigger("click");
}

function getSelectedFileDropDown () {
    var dropDown = $("#file-dropdown").find("button");
    return {
        name: dropDown.text(),
        path: dropDown.attr("value")
    };
}

function changeFileDropDown (event) {
    var dropDown = $("#file-dropdown").find("button");

    var target = $(event.currentTarget);

    dropDown.text(target.text())
        .append('<span class="caret"/>')
        .attr("value", target.parent().attr("value"));

    $.ajax({
        url: "/api/getFile?path=" + dropDown.attr("value"),
        success: function (data) {
            var range = require("ace/range").Range;
            data = JSON.parse(data);
            aceEditor.setValue(data.contents);
            //aceEditor.selection.setRange(new Range(0, 0, 0, 0));
            aceEditor.getSession().getSelection().setSelectionRange({
                start: {row: 0, column: 0},
                end: {row: 0, column: 0}
            });

            aceEditorUndoManager.markClean();
            aceEditorUndoManager.reset();
            aceCheckClean();
        }
    });
}

$(function () {
    ideList = $("#ide-list").empty();
    configList = $("#config-list");
    editorPanel = $("#editor-panel");

    $.ajaxSetup({
        cache: true
    });

    $("#alert").find(".close")
        .click(function () {
            $(this).parents("#alert").slideUp("slow");
        });

    // get configurations from the server
    $.ajax({
        url: "/api/discoverConfigurations",
        cache: false,
        success: function (data) {
            data = JSON.parse(data);
            discoveredConfigurations = data;

            data.foundConfigs.forEach(function (e) {
                $("<a>")
                    .attr("href", "javascript:void(0);")
                    .addClass("list-group-item")
                    .click(ideListClick)
                    .append($("<img>")
                        .attr("src", "images/" + e.type + ".png"))
                    .append(e.type)
                    .appendTo(ideList);
            })
        },
        error: function (xhr, status, err) {
            ideList.html("Could not retrieve configurations from the server");
            console.error(xhr, status, err);
        }
    });

    $("#btn-rename").click(function () {
        $("#rename-modal")
            .on("show.bs.modal", function () {
                var currentSelection = getSelectedFileDropDown();
                var acceptButton = $("#rename-modal").find("#accept");
                var newFileInput = $(this).find("#new-file");
                var oldVal = newFileInput
                    .val(currentSelection.name)
                    .val();

                newFileInput
                    .select()
                    .focus()
                    .on("keyup", function () {
                        var form = $(this).parents(".form-group");
                        var val = $(this).val();

                        if (val !== oldVal) {
                            acceptButton.removeClass("disabled");

                            if (val.length > 0) {
                                form.removeClass("has-error");
                                acceptButton.removeClass("disabled");
                            }
                            else {
                                form.addClass("has-error");
                                acceptButton.addClass("disabled");
                            }
                        }
                        else
                            acceptButton.addClass("disabled");

                    });

                acceptButton.click(function () {
                    acceptButton.button("loading");
                    var closeButton = $("#rename-modal")
                        .find("#close")
                        .addClass("disabled");

                    $.ajax({
                        url: "/api/renameFile?path=" +
                        encodeURIComponent(currentSelection.path) +
                        "&newName=" +
                        encodeURIComponent(newFileInput.val()),

                        success: function (data) {
                            acceptButton.button("reset");
                            closeButton.removeClass("disabled");
                            $("#rename-modal").modal("hide");
                            reloadSelections();
                        }
                    });
                });
            })
            .modal({
                show: true,
                backdrop: "static"
            });
    });

    $("#btn-reset").click(function () {
        $("#reset-modal").modal({
            show: true
        })
            .find("#accept")
            .click(function () {
                aceUndoAll();
                $("#reset-modal").modal("hide");
            });
    });

    $("#btn-save").click(function () {
        $("#save-modal").modal({
            show: true
        })
            .find("#accept")
            .click(function () {
                var file = getSelectedFileDropDown();
                $.ajax({
                    url: "/api/writeFile?path=" + encodeURIComponent(file.path) + "&contents=" + encodeURIComponent(aceEditor.getValue()),
                    success: function () {
                        aceEditorUndoManager.reset();
                        aceEditorUndoManager.markClean();
                        aceCheckClean();
                        $("#save-modal").modal("hide");
                    }
                });
            });
    });

    $("#btn-copy-to").click(function () {
        $("#copy-to-modal")
            .on("show.bs.modal", function () {
                var copyList = $(this).find("#copy-to-list")
                    .html(ideList.clone())
                    .find("a")
                    .each(function (i, e) {
                        e = $(e);
                        if (e.is(".active"))
                            e.remove();
                        else
                            e.removeClass("active")
                                .off("click")
                                .on("click", function () {
                                    $(this).toggleClass("active");

                                    var btn = $(this).parents().find("#accept");
                                    if ($("#copy-to-list").find("a.active").length > 0) {
                                        btn.removeClass("disabled");
                                    }
                                    else {
                                        btn.addClass("disabled");
                                    }
                                });
                    });
            }).modal({
                show: true
            })
            .find("#accept")
            .click(function () {
                var file = getSelectedFileDropDown();
                var ides = $("#copy-to-list")
                    .find(".active")
                    .map(function (i, e) { return "&ide=" + encodeURIComponent(e.text) });

                // map returns a jquery selector, use get() to get the inner type (array) to join
                var ideQuery = ides.get().join("");

                $.ajax({
                    url: "/api/copyConfig?path=" + encodeURIComponent(file.path) + ideQuery,
                    success: function (data) {
                        $("#copy-to-modal").modal("hide");

                        var html = 'Copied ' + configList.find(".active").text() + ' <b>' + file.name + '</b> to ';
                        ides.get().forEach(function (e, i, arr) {
                            e = e.replace("&ide=", "");
                            if (i !== 0 && arr.length !== 2)
                                html += ',';

                            if (i + 1 === arr.length && arr.length > 1)
                                html += ' and';

                            html += ' <i>' + e + '</i>';
                        });
                        html += '!';

                        $("#alert")
                            .slideDown()
                            .find("#content")
                            .html(html);
                    }
                });
            });
    });
});
