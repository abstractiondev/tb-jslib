/**
 * Created by kalle on 27.1.2014.
 */
/// <reference path="jquery.d.ts" />
var TheBall;
(function (TheBall) {
    var Interface;
    (function (Interface) {
        var UI;
        (function (UI) {
            var StatusData = (function () {
                function StatusData() {
                }
                return StatusData;
            }());
            UI.StatusData = StatusData;
            var TrackingExtension = (function () {
                function TrackingExtension() {
                    this.ChangeListeners = [];
                }
                return TrackingExtension;
            }());
            UI.TrackingExtension = TrackingExtension;
            var TrackedObject = (function () {
                function TrackedObject() {
                }
                TrackedObject.GetRelativeUrl = function (currObject) {
                    return currObject.RelativeLocation;
                };
                TrackedObject.UpdateObject = function (currObject, triggeredTick, dcm) {
                    currObject.UIExtension.ChangeListeners.forEach(function (func) { return func(currObject, triggeredTick); });
                    //var fetchUrl = TrackedObject.GetRelativeUrl(currObject);
                    //var templateDataSource =
                    /*
                     var fetchUrl = currObject.UIExtension.FetchedUrl;
                     console.log("Fetching from url: " + fetchUrl);
                     $.ajax( { url : fetchUrl, cache: false,
                     success: function(updatedObject:TrackedObject) {
                     dcm.SetObjectInStorage(updatedObject);
                     updatedObject.UIExtension.LastUpdatedTick = triggeredTick;
                     updatedObject.UIExtension.ChangeListeners.forEach(func => func(updatedObject));
                     }
                     });*/
                };
                return TrackedObject;
            }());
            UI.TrackedObject = TrackedObject;
            var DataConnectionManager = (function () {
                function DataConnectionManager() {
                    this.TrackedObjectStorage = {};
                    this.LastProcessedTick = "";
                    this.InitialTick = "";
                    var initialStatusFetch = $.ajax({
                        url: "../../TheBall.Interface/StatusSummary/default.json", cache: true,
                        async: false
                    });
                    $.when(initialStatusFetch).then(function (data) {
                        var initialTimestamp;
                        if (data.ChangeItemTrackingList.length > 0)
                            initialTimestamp = data.ChangeItemTrackingList[0];
                        else
                            initialTimestamp = "T:";
                        this.InitialTick = initialTimestamp;
                    });
                }
                DataConnectionManager.prototype.SetObjectInStorage = function (obj) {
                    var currObject = this.TrackedObjectStorage[obj.ID];
                    this.TrackedObjectStorage[obj.ID] = obj;
                    if (currObject) {
                        obj.UIExtension = currObject.UIExtension;
                    }
                    this.setInnerObjectsInStorage(obj);
                };
                DataConnectionManager.prototype.setInnerObjectsInStorage = function (obj) {
                    var dcm = this;
                    if (typeof obj == "object") {
                        $.each(obj, function (indexOrKey, innerObj) {
                            if (innerObj) {
                                if (innerObj.MasterETag) {
                                    console.log("Added inner object: " + innerObj.RelativeLocation);
                                    var currObject = dcm.TrackedObjectStorage[innerObj.ID];
                                    if (currObject) {
                                        innerObj.UIExtension = currObject.UIExtension;
                                    }
                                    dcm.TrackedObjectStorage[innerObj.ID] = innerObj;
                                }
                                dcm.setInnerObjectsInStorage(innerObj);
                            }
                        });
                    }
                };
                DataConnectionManager.prototype.ProcessStatusData = function (statusData) {
                    var idList = statusData.ChangeItemTrackingList;
                    var currTimestamp;
                    var currProcessedTick;
                    for (var i = 0; i < idList.length; i++) {
                        var currItem = idList[i];
                        if (currItem.charAt(0) == "T") {
                            currTimestamp = currItem;
                            if (currTimestamp <= this.LastProcessedTick)
                                break;
                            continue;
                        }
                        // If curr processed is undefined, we set it from here, thus it will be last
                        if (!currProcessedTick)
                            currProcessedTick = currTimestamp;
                        var currID = currItem.substr(2);
                        var currModification = currItem.substr(0, 1);
                        var currTracked = this.TrackedObjectStorage[currID];
                        if (currTracked && currTracked.UIExtension && currTracked.UIExtension.LastUpdatedTick) {
                            console.log("Checking for update basis: " + currTracked.ID + " " +
                                currTracked.UIExtension.LastUpdatedTick + " vs " + currTimestamp);
                        }
                        else {
                            console.log("Not tracked update for id: " + currID);
                        }
                        if (currTracked && currTracked.UIExtension && currTracked.UIExtension.LastUpdatedTick < currTimestamp) {
                            console.log("Updating...");
                            TrackedObject.UpdateObject(currTracked, currTimestamp, this);
                        }
                    }
                    if (currProcessedTick) {
                        console.log("Processed up to tick: " + currProcessedTick);
                        this.LastProcessedTick = currProcessedTick;
                    }
                };
                DataConnectionManager.prototype.PerformAsyncPoll = function () {
                    var priv = this;
                    $.ajax({
                        url: "../../TheBall.Interface/StatusSummary/default.json", cache: true,
                        success: function (data) {
                            //console.log("Polled status...");
                            priv.ProcessStatusData(data);
                        }
                    });
                };
                DataConnectionManager.prototype.ProcessFetchedData = function (jsonData) {
                    if (jsonData.RelativeLocation) {
                        var currTracked = this.TrackedObjectStorage[jsonData.ID];
                        if (currTracked) {
                            var currExtension = currTracked.UIExtension;
                            this.TrackedObjectStorage[jsonData.ID] = jsonData;
                            currTracked = jsonData;
                            jsonData.UIExtension = currExtension;
                        }
                    }
                };
                DataConnectionManager.prototype.FetchAndProcessJSONData = function (dataUrl) {
                    $.ajax({
                        url: dataUrl, cache: true,
                        success: this.ProcessFetchedData
                    });
                };
                return DataConnectionManager;
            }());
            UI.DataConnectionManager = DataConnectionManager;
        })(UI = Interface.UI || (Interface.UI = {}));
    })(Interface = TheBall.Interface || (TheBall.Interface = {}));
})(TheBall || (TheBall = {}));
//# sourceMappingURL=DataConnectionManager.js.map
/**
 * Created by kalle on 10.2.2014.
 */
/// <reference path="jquery.d.ts" />
/// <reference path="DataConnectionManager.ts" />
var TheBall;
(function (TheBall) {
    var Interface;
    (function (Interface) {
        var UI;
        (function (UI) {
            var BinaryFileItem = (function () {
                function BinaryFileItem(inputElement, file, content) {
                    this.inputElement = inputElement;
                    this.file = file;
                    this.content = content;
                }
                BinaryFileItem.prototype.IsSet = function () {
                    if (this.inputElement.name)
                        return true;
                    return false;
                };
                BinaryFileItem.prototype.GetPropertyName = function () {
                    //var $inputElement = $(this.inputElement);
                    //var propName = $inputElement.attr("data-oipfile-propertyname");
                    var propName = this.inputElement.name;
                    return propName;
                };
                BinaryFileItem.prototype.GetEmbeddedPropertyContent = function () {
                    if (!this.file || !this.file.name || !this.content)
                        return null;
                    return this.file.name + ":" + this.content;
                };
                return BinaryFileItem;
            }());
            UI.BinaryFileItem = BinaryFileItem;
            var OperationManager = (function () {
                function OperationManager(dcm, binaryFileSelectorBase) {
                    this.getHiddenInput = function (key, dataContent) {
                        var dataValue = dataContent != null ? dataContent.toString() : "";
                        var $input = $('<input type="hidden">').attr('name', key).val(dataValue);
                        return $input;
                    };
                    if (!dcm)
                        dcm = new TheBall.Interface.UI.DataConnectionManager();
                    if (!binaryFileSelectorBase)
                        binaryFileSelectorBase = ".oipfile";
                    this.DCM = dcm;
                    this.BinaryFileSelectorBase = binaryFileSelectorBase;
                    var $body = $("body");
                    var formHtml = "<form style='margin:0px;width:0px;height:0px;background-color: transparent;border: 0px none transparent;padding: 0px;overflow: hidden;visibility:hidden'  enctype='multipart/form-data' id='OperationManager_DynamicIFrameForm' " +
                        "method='post' target='OperationManager_IFrame'></form> ";
                    var iFrameHtml = "<iframe style='margin:0px;width:0px;height:0px;background-color: transparent;border: 0px none transparent;padding: 0px;overflow: hidden;visibility: hidden' name='OperationManager_IFrame' src='about:blank'></iframe>";
                    $body.append(formHtml);
                    $body.append(iFrameHtml);
                    this.$submitForm = $("#OperationManager_DynamicIFrameForm");
                    if (typeof String.prototype["startsWith"] != 'function') {
                        // see below for better implementation!
                        String.prototype["startsWith"] = function (str) {
                            return this.lastIndexOf(str, 0) === 0;
                        };
                    }
                }
                OperationManager.prototype.SaveIndependentObject = function (objectID, objectRelativeLocation, objectETag, objectData, successCallback, failureCallback, keyNameResolver) {
                    var $form = this.$submitForm;
                    $form.empty();
                    var id = objectID;
                    var contentSourceInfo = objectRelativeLocation + ":" + objectETag;
                    $form.append(this.getHiddenInput("ContentSourceInfo", contentSourceInfo));
                    $form.append(this.getHiddenInput("NORELOAD", ""));
                    var realKey;
                    for (var key in objectData) {
                        if (key.startsWith("File_"))
                            realKey = key.replace("File_", "File_" + id + "_");
                        else if (key.startsWith("Object_"))
                            realKey = key.replace("Object_", "Object_" + id + "_");
                        else if (key.startsWith("FileEmbedded_"))
                            realKey = key.replace("FileEmbedded_", "FileEmbedded_" + id + "_");
                        else
                            realKey = id + "_" + key;
                        if (keyNameResolver)
                            realKey = keyNameResolver(realKey);
                        var $hiddenInput = this.getHiddenInput(realKey, objectData[key]);
                        $form.append($hiddenInput);
                    }
                    //$form.submit();
                    if (!failureCallback)
                        failureCallback = function () { };
                    var userFailure = failureCallback;
                    var userSuccess = function (responseData) {
                        if (successCallback)
                            successCallback(responseData);
                    };
                    var me = this;
                    $.ajax({
                        type: "POST",
                        data: $form.serialize()
                    }).done(function (response) { me.AjaxPollingOperation(response, userSuccess, userFailure); }).fail(userFailure);
                    $form.empty();
                };
                OperationManager.prototype.AjaxPollingOperation = function (response, userSuccess, userFailure) {
                    var totalSecs = 0;
                    var operationID = response.OperationID;
                    var opPollUrl = "../../TheBall.Interface/InterfaceOperation/" + operationID + ".json";
                    var $deferredResult = $.Deferred();
                    var pollFunc = function (retryFunc, finishFunc, $deferred) {
                        $.ajax(opPollUrl).done(function (response) {
                            if (response && response.ErrorMessage) {
                                console.log("OP Error: " + totalSecs);
                                var errorObject = {
                                    ErrorCode: response.ErrorCode,
                                    ErrorMessage: response.ErrorMessage
                                };
                                if (userFailure)
                                    userFailure(errorObject);
                                $deferred.reject(errorObject);
                            }
                            else {
                                console.log("OP Retrying in 1 sec... total count: " + totalSecs);
                                totalSecs++;
                                setTimeout(function () { retryFunc(retryFunc, finishFunc); }, 1000);
                            }
                        }).fail(function () {
                            if (finishFunc)
                                finishFunc();
                            $deferred.resolve();
                        });
                    };
                    pollFunc(pollFunc, userSuccess, $deferredResult);
                    return $deferredResult.promise();
                };
                OperationManager.prototype.SaveObject = function (objectID, objectETag, dataContents) {
                    var obj = this.DCM.TrackedObjectStorage[objectID];
                    if (!obj)
                        throw "Object not found with ID: " + objectID;
                    if (obj.MasterETag != objectETag)
                        throw "Object ETag mismatch on save: " + objectID;
                    this.SaveIndependentObject(obj.ID, obj.RelativeLocation, obj.MasterETag, dataContents);
                };
                OperationManager.prototype.DeleteIndependentObject = function (domainName, objectName, objectID, successCallback, failureCallback) {
                    var $form = this.$submitForm;
                    $form.empty();
                    $form.append(this.getHiddenInput("ObjectDomainName", domainName));
                    $form.append(this.getHiddenInput("ObjectName", objectName));
                    $form.append(this.getHiddenInput("ObjectID", objectID));
                    $form.append(this.getHiddenInput("ExecuteOperation", "DeleteSpecifiedInformationObject"));
                    $form.append(this.getHiddenInput("NORELOAD", ""));
                    //$form.submit();
                    if (!failureCallback)
                        failureCallback = function () { };
                    var userFailure = failureCallback;
                    var userSuccess = function (responseData) {
                        if (successCallback)
                            successCallback(responseData);
                    };
                    var me = this;
                    $.ajax({
                        type: "POST",
                        data: $form.serialize()
                    }).done(function (response) { me.AjaxPollingOperation(response, userSuccess, userFailure); }).fail(userFailure);
                    $form.empty();
                };
                OperationManager.prototype.DeleteObject = function (objectID) {
                    var obj = this.DCM.TrackedObjectStorage[objectID];
                    if (!obj)
                        throw "Object not found with ID: " + objectID;
                    var contentSourceInfo = obj.RelativeLocation + ":" + obj.MasterETag;
                    var objectID = obj.ID;
                    var domainName = obj.SemanticDomainName;
                    var objectName = obj.Name;
                    this.DeleteIndependentObject(domainName, objectName, objectID);
                };
                OperationManager.prototype.CreateObjectAjax = function (domainName, objectName, dataContents, successCallback, failureCallback) {
                    var $form = this.$submitForm;
                    $form.empty();
                    $form.append(this.getHiddenInput("ObjectDomainName", domainName));
                    $form.append(this.getHiddenInput("ObjectName", objectName));
                    $form.append(this.getHiddenInput("ExecuteOperation", "CreateSpecifiedInformationObjectWithValues"));
                    $form.append(this.getHiddenInput("NORELOAD", ""));
                    for (var key in dataContents) {
                        var $hiddenInput = this.getHiddenInput(key, dataContents[key]);
                        $form.append($hiddenInput);
                    }
                    //$form.submit();
                    if (!failureCallback)
                        failureCallback = function () { };
                    var userFailure = failureCallback;
                    var userSuccess = function (responseData) {
                        if (successCallback)
                            successCallback(responseData);
                    };
                    var me = this;
                    $.ajax({
                        type: "POST",
                        data: $form.serialize()
                    }).done(function (response) { me.AjaxPollingOperation(response, userSuccess, userFailure); }).fail(userFailure);
                    $form.empty();
                };
                OperationManager.prototype.ExecuteOperationWithForm = function (operationName, operationParameters, successCallback, failureCallback) {
                    var $form = this.$submitForm;
                    $form.empty();
                    $form.append(this.getHiddenInput("ExecuteOperation", operationName));
                    for (var key in operationParameters) {
                        var $hiddenInput = this.getHiddenInput(key, operationParameters[key]);
                        $form.append($hiddenInput);
                    }
                    $form.append(this.getHiddenInput("NORELOAD", ""));
                    //$form.submit();
                    if (!failureCallback)
                        failureCallback = function () { };
                    var userFailure = failureCallback;
                    var userSuccess = function (responseData) {
                        if (successCallback)
                            successCallback(responseData);
                    };
                    var me = this;
                    $.ajax({
                        type: "POST",
                        data: $form.serialize()
                    }).done(function (response) { me.AjaxPollingOperation(response, userSuccess, userFailure); }).fail(userFailure);
                    $form.empty();
                };
                OperationManager.prototype.ExecuteOperationWithAjax = function (operationFullName, contentObject, successCallback, failureCallback) {
                    var jsonData = JSON.stringify(contentObject);
                    if (!failureCallback)
                        failureCallback = function () { };
                    var userFailure = failureCallback;
                    var userSuccess = function (responseData) {
                        if (successCallback)
                            successCallback(responseData);
                    };
                    var me = this;
                    return $.ajax({ type: "POST",
                        url: "?operation=" + operationFullName,
                        contentType: "application/json",
                        data: jsonData
                    }).then(function (response) {
                        var $promise = me.AjaxPollingOperation(response, userSuccess, userFailure);
                        return $promise;
                    }, userFailure);
                };
                OperationManager.prototype.setButtonMode = function ($button, mode) {
                    var buttonText = mode == "add" ? "Add Image" : "Remove Image";
                    $button.attr('data-mode', mode);
                    $button.html(buttonText);
                };
                OperationManager.prototype.reset_field = function (e) {
                    e.wrap('<form>').parent('form').trigger('reset');
                    e.unwrap();
                };
                OperationManager.prototype.setImageValues = function ($file, $hidden, fileFieldName) {
                    //$hidden.attr('name', '');
                    $hidden.removeAttr('name');
                    $file.attr('name', fileFieldName);
                };
                OperationManager.prototype.clearImageValue = function ($file, $hidden, fileFieldName) {
                    $hidden.attr('name', fileFieldName);
                    //$file.attr('name', '');
                    $file.removeAttr('name');
                };
                OperationManager.prototype.setSelectFileButtonEvents = function ($selectButton, $fileInput) {
                    $selectButton.off("click.oip").on("click.oip", function () {
                        $fileInput.click();
                    });
                };
                OperationManager.prototype.setRemoveFileButtonEvents = function ($removeButton, $fileInput, $hiddenInput, $imagePreview) {
                    var me = this;
                    $removeButton.off("click.oip").on("click.oip", function () {
                        var fileFieldName = $fileInput.attr("data-oipfile-propertyname");
                        me.reset_field($fileInput);
                        me.setPreviewImageSrc($imagePreview, null);
                        me.clearImageValue($fileInput, $hiddenInput, fileFieldName);
                    });
                };
                OperationManager.prototype.setPreviewImageSrc = function ($imagePreview, srcContent) {
                    if (!srcContent) {
                        var noImageUrl = $imagePreview.attr("data-oipfile-noimageurl");
                        if (!noImageUrl) {
                            $imagePreview.hide();
                        }
                        $imagePreview.attr('src', noImageUrl);
                    }
                    else {
                        console.log("Existing src: " + $imagePreview.attr('src'));
                        console.log("Changing-to src: " + srcContent);
                        $imagePreview.attr('src', srcContent);
                        console.log("New src: " + $imagePreview.attr('src'));
                        $imagePreview.show();
                    }
                };
                OperationManager.prototype.setFileInputEvents = function ($fileInput, $hiddenInput, $imagePreview) {
                    var me = this;
                    var fileFieldName = $fileInput.attr("data-oipfile-propertyname");
                    var changeEventName = "change.oip";
                    $fileInput.off(changeEventName).on(changeEventName, function () {
                        var input = this;
                        if (input.files && input.files[0]) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                me.setPreviewImageSrc($imagePreview, e.target.result);
                                me.setImageValues($fileInput, $hiddenInput, fileFieldName);
                            };
                            reader.readAsDataURL(input.files[0]);
                        }
                    });
                };
                OperationManager.prototype.InitiateBinaryFileElementsAroundInput = function ($fileInput, objectID, propertyName, initialPreviewUrl, noImageUrl, currentGroupID) {
                    var jQueryClassSelector = this.BinaryFileSelectorBase;
                    var inputFileSelector = "input" + jQueryClassSelector + "[type='file']";
                    //var hiddenInputSelector = "input" + jQueryClassSelector + "[type='hidden']";
                    //var previewImgSelector = "img" + jQueryClassSelector;
                    var inputFileWithNameSelector = inputFileSelector + "[name]";
                    //var hiddenInputWithNameSelector = hiddenInputSelector + "[name]";
                    var dataAttrPrefix = "data-";
                    var fileGroupIDDataName = "oipfile-filegroupid";
                    var objectIDDataName = "oipfile-objectid";
                    var propertyDataName = "oipfile-propertyname";
                    var buttonTypeDataName = "oipfile-buttontype";
                    var buttonTypeSelect = "select";
                    var buttonTypeRemove = "remove";
                    var imgPreviewNoImageUrlDataName = "oipfile-noimageurl";
                    if ($fileInput.length === 0) {
                        $fileInput = $("input.oipfile-rootitem[" + dataAttrPrefix + fileGroupIDDataName + "='" + currentGroupID + "']");
                        if ($fileInput.length === 0)
                            throw "Cannot find existing $fileInput for group: " + currentGroupID;
                    }
                    else {
                        $fileInput.addClass("oipfile-rootitem");
                        $fileInput.attr(dataAttrPrefix + fileGroupIDDataName, currentGroupID);
                    }
                    $fileInput.addClass("oipfile");
                    $fileInput.hide();
                    $fileInput.width(0);
                    $fileInput.height(0);
                    $fileInput.attr(dataAttrPrefix + propertyDataName, propertyName);
                    $fileInput.attr(dataAttrPrefix + objectIDDataName, objectID);
                    $fileInput.removeAttr("name");
                    this.reset_field($fileInput);
                    //var currentGroupID = $fileInput.attr(dataAttrPrefix + fileGroupIDDataName);
                    var currentGroupDataSelectorString = "[data-" + fileGroupIDDataName + "='" + currentGroupID + "']";
                    var previewImgSelector = "img.oipfile" + currentGroupDataSelectorString;
                    var $previevImg = $(previewImgSelector);
                    if ($previevImg.length === 0) {
                        $previevImg = $("<img class='oipfile' />");
                        $previevImg.attr(dataAttrPrefix + fileGroupIDDataName, currentGroupID);
                        if (!noImageUrl)
                            noImageUrl = "";
                        $previevImg.attr(dataAttrPrefix + imgPreviewNoImageUrlDataName, noImageUrl);
                        $previevImg.insertBefore($fileInput);
                    }
                    console.log("Trying to set preview url as: " + initialPreviewUrl);
                    this.setPreviewImageSrc($previevImg, initialPreviewUrl);
                    var hiddenInputSelector = "input.oipfile[type='hidden']" + currentGroupDataSelectorString;
                    var $hiddenInput = $(hiddenInputSelector);
                    if ($hiddenInput.length === 0) {
                        $hiddenInput = $("<input class='oipfile' type='hidden'>");
                        $hiddenInput.attr(dataAttrPrefix + fileGroupIDDataName, currentGroupID);
                        $hiddenInput.insertBefore($fileInput);
                    }
                    $hiddenInput.removeAttr("name");
                    this.setFileInputEvents($fileInput, $hiddenInput, $previevImg);
                    var selectButtonSelector = ".oipfile"
                        + currentGroupDataSelectorString
                        + "[data-" + buttonTypeDataName + "='" + buttonTypeSelect + "']";
                    var $selectButton = $(selectButtonSelector);
                    if ($selectButton.length === 0) {
                        // Create select button
                        $selectButton = $("<a class='button small oipfile'>Select</a>");
                        $selectButton.attr(dataAttrPrefix + fileGroupIDDataName, currentGroupID);
                        $selectButton.attr(dataAttrPrefix + buttonTypeDataName, buttonTypeSelect);
                        $selectButton.insertAfter($fileInput);
                    }
                    this.setSelectFileButtonEvents($selectButton, $fileInput);
                    var removeButtonSelector = ".oipfile"
                        + currentGroupDataSelectorString
                        + "[data-" + buttonTypeDataName + "='" + buttonTypeRemove + "']";
                    var $removeButton = $(removeButtonSelector);
                    if ($removeButton.length === 0) {
                        // Create remove button
                        $removeButton = $("<a class='button small oipfile'>Remove</a>");
                        $removeButton.attr(dataAttrPrefix + fileGroupIDDataName, currentGroupID);
                        $removeButton.attr(dataAttrPrefix + buttonTypeDataName, buttonTypeRemove);
                        $removeButton.insertAfter($selectButton);
                    }
                    this.setRemoveFileButtonEvents($removeButton, $fileInput, $hiddenInput, $previevImg);
                };
                OperationManager.prototype.InitiateBinaryFileElements = function (fileInputID, objectID, propertyName, initialPreviewUrl, noImageUrl) {
                    var $fileInput = $("#" + fileInputID);
                    var dataAttrPrefix = "data-";
                    var fileGroupIDDataName = "oipfile-filegroupid";
                    var currentGroupID = $fileInput.attr(dataAttrPrefix + fileGroupIDDataName);
                    this.InitiateBinaryFileElementsAroundInput($fileInput, objectID, propertyName, initialPreviewUrl, noImageUrl, currentGroupID);
                };
                OperationManager.prototype.readFileFromInputAsync = function (fileInput) {
                    if (fileInput.files && fileInput.files[0]) {
                        var file = fileInput.files[0];
                        return this.readFileAsync(fileInput, file);
                    }
                    var emptyDeferred = $.Deferred();
                    emptyDeferred.resolve(new BinaryFileItem(fileInput, null, null));
                    return emptyDeferred.promise();
                };
                OperationManager.prototype.readFileAsync = function (fileInput, file) {
                    var reader = new FileReader();
                    var deferred = $.Deferred();
                    reader.onload = function (event) {
                        deferred.resolve(new BinaryFileItem(fileInput, file, event.target.result));
                    };
                    reader.onerror = function () {
                        deferred.reject(this);
                    };
                    reader.readAsDataURL(file);
                    return deferred.promise();
                };
                OperationManager.prototype.AppendBinaryFileValuesToData = function (objectID, data, callBack) {
                    this.PrepareBinaryFileContents(objectID, function (binaryFileItems) {
                        var imageFieldName;
                        var editedModalImage;
                        for (var i = 0; i < binaryFileItems.length; i++) {
                            var item = binaryFileItems[i];
                            var propertyName = item.GetPropertyName();
                            if (item.IsSet() && propertyName) {
                                editedModalImage = item.GetEmbeddedPropertyContent();
                                imageFieldName = "FileEmbedded_" + propertyName;
                                data[imageFieldName] = editedModalImage;
                            }
                        }
                        callBack();
                    });
                };
                OperationManager.prototype.PrepareBinaryFileContents = function (objectID, callBack) {
                    var me = this;
                    var jQueryClassSelector = this.BinaryFileSelectorBase;
                    var inputFileSelector = "input.oipfile"
                        + "[type='file'][data-oipfile-objectid='" + objectID + "' ]";
                    var inputFileWithNameSelector = inputFileSelector + "[name]";
                    var inputFileWithoutNameSelector = inputFileSelector + ":not([name])";
                    var hiddenInputSelector = "input.oipfile[type='hidden']";
                    var hiddenInputWithNameSelector = hiddenInputSelector + "[name]";
                    var $hiddenInputsWithName = $();
                    var $inputFilesWithoutName = $(inputFileWithoutNameSelector);
                    $inputFilesWithoutName.each(function (index, element) {
                        var currentGroupID = $(this).attr("data-oipfile-filegroupid");
                        var relativeHiddenWithNameSelector = hiddenInputWithNameSelector
                            + "[data-oipfile-filegroupid='" + currentGroupID + "']";
                        var $relativeHiddenWithName = $(relativeHiddenWithNameSelector);
                        $hiddenInputsWithName = $hiddenInputsWithName.add($relativeHiddenWithName);
                    });
                    var $filesToAdd = $(inputFileWithNameSelector);
                    var $fileReadingPromises = $filesToAdd.map(function (index, element) {
                        var inputElement = element;
                        return me.readFileFromInputAsync(inputElement);
                    });
                    var $filesToRemove = $hiddenInputsWithName;
                    var $fileRemoveData = $filesToRemove.map(function (index, element) {
                        var inputElement = element;
                        return new BinaryFileItem(inputElement, null, null);
                    });
                    var concatCallbackArray = $fileReadingPromises.add($fileRemoveData);
                    $.when.apply($, concatCallbackArray).then(function () {
                        var args = arguments;
                        callBack(args);
                    });
                };
                return OperationManager;
            }());
            UI.OperationManager = OperationManager;
        })(UI = Interface.UI || (Interface.UI = {}));
    })(Interface = TheBall.Interface || (TheBall.Interface = {}));
})(TheBall || (TheBall = {}));
var OperationManager = TheBall.Interface.UI.OperationManager;
var $TB = new OperationManager(null, null);
//# sourceMappingURL=OperationManager.js.map
/**
* Created by kalle on 29.1.2014.
*/
var TheBall;
(function (TheBall) {
    (function (Interface) {
        /// <reference path="jquery.d.ts" />
        /// <reference path="DataConnectionManager.ts" />
        /// <reference path="dustjs-linkedin.d.ts" />
        (function (UI) {
            var TemplateHook = (function () {
                function TemplateHook(templateName, jQuerySelector, dataSources, preRenderingDataProcessor, postRenderingDataProcessor, hiddenElementRendering) {
                    this.templateName = templateName;
                    this.jQuerySelector = jQuerySelector;
                    this.dataSources = dataSources;
                    this.preRenderingDataProcessor = preRenderingDataProcessor;
                    this.postRenderingDataProcessor = postRenderingDataProcessor;
                    this.hiddenElementRendering = hiddenElementRendering;
                }
                return TemplateHook;
            })();
            UI.TemplateHook = TemplateHook;

            var TimestampedFetch = (function () {
                function TimestampedFetch(Timestamp, FetchUrl, FetchCallBack) {
                    this.Timestamp = Timestamp;
                    this.FetchUrl = FetchUrl;
                    this.FetchCallBack = FetchCallBack;
                }
                TimestampedFetch.prototype.ExecuteAjaxToPromise = function () {
                    if (!this.ajaxPromise) {
                        this.ajaxPromise = this.ajaxPromise = $.ajax({
                            url: this.FetchUrl, cache: true,
                            success: this.FetchCallBack });
                    }
                    return this.ajaxPromise;
                };
                return TimestampedFetch;
            })();
            UI.TimestampedFetch = TimestampedFetch;

            var TemplateDataSource = (function () {
                function TemplateDataSource() {
                    this.UsedInTemplates = [];
                }
                TemplateDataSource.prototype.GetObjectContent = function () {
                    return this.DCM.TrackedObjectStorage[this.ObjectID];
                };

                /*
                RefreshObjectChange(trackedObject:TrackedObject, currTimestamp:string) {
                console.log("Refreshing object: " + trackedObject.ID + " used in: " + this.UsedInTemplates.join());
                this.TMM.RefreshNamedTemplates(currTimestamp, this.UsedInTemplates);
                }*/
                TemplateDataSource.prototype.RefreshTemplates = function (currTimestamp) {
                    this.TMM.RefreshNamedTemplates(currTimestamp, this.UsedInTemplates);
                };
                return TemplateDataSource;
            })();
            UI.TemplateDataSource = TemplateDataSource;

            var TemplateModuleManager = (function () {
                function TemplateModuleManager(dcm) {
                    this.DataSourceFetchStorage = {};
                    this.TemplateHookStorage = {};
                    if (!dcm)
                        dcm = new TheBall.Interface.UI.DataConnectionManager();
                    this.DCM = dcm;
                }
                TemplateModuleManager.prototype.CreateTimestampedFetchWithZeroTimestamp = function (fetchUrl, fetchCallBack) {
                    var tsFetch = new TimestampedFetch("", fetchUrl, fetchCallBack);
                    return tsFetch;
                };

                TemplateModuleManager.prototype.CreateObjectUpdateFetchPromise = function (timestamp, objectToUpdate) {
                    var me = this;
                    var tsFetch = new TimestampedFetch(timestamp, objectToUpdate.UIExtension.FetchedUrl, function (fetchedObject) {
                        fetchedObject.UIExtension = objectToUpdate.UIExtension;
                        fetchedObject.UIExtension.LastUpdatedTick = timestamp;
                        me.DCM.SetObjectInStorage(fetchedObject);
                    });
                    return tsFetch;
                };

                TemplateModuleManager.prototype.InitialObjectFetchCB = function (trackedObject, existingDataSource) {
                    var me = this;
                    if (trackedObject.ID) {
                        var id = trackedObject.ID;
                        trackedObject.UIExtension = new TheBall.Interface.UI.TrackingExtension();
                        trackedObject.UIExtension.FetchedUrl = existingDataSource.RelativeUrl;
                        trackedObject.UIExtension.ChangeListeners.push(function (refreshedObject, currTimestamp) {
                            if (existingDataSource.FetchInfo.Timestamp != currTimestamp) {
                                existingDataSource.FetchInfo = me.CreateObjectUpdateFetchPromise(currTimestamp, refreshedObject);
                                existingDataSource.RefreshTemplates(currTimestamp);
                            }
                        });
                        trackedObject.UIExtension.LastUpdatedTick = me.DCM.InitialTick; //me.DCM.LastProcessedTick;
                        this.DCM.SetObjectInStorage(trackedObject);
                    }
                    existingDataSource.ObjectID = trackedObject.ID;
                };

                TemplateModuleManager.prototype.InitiateTemplateDataSource = function (relativeUrl, templateName) {
                    var existingDataSource = this.DataSourceFetchStorage[relativeUrl];
                    var me = this;
                    if (!existingDataSource) {
                        existingDataSource = new TemplateDataSource();
                        existingDataSource.DCM = me.DCM;
                        existingDataSource.TMM = me;
                        existingDataSource.RelativeUrl = relativeUrl;
                        this.DataSourceFetchStorage[relativeUrl] = existingDataSource;
                        existingDataSource.FetchInfo = this.CreateTimestampedFetchWithZeroTimestamp(relativeUrl, function (trackedObject) {
                            me.InitialObjectFetchCB(trackedObject, existingDataSource);
                        });
                    }
                    existingDataSource.UsedInTemplates.push(templateName);
                    return existingDataSource;
                };

                TemplateModuleManager.prototype.RegisterAndReplaceTemplate = function (templateName, jQuerySelector, dataSourceUrls, preRenderingDataProcessor, postRenderingDataProcessor, hiddenElementRendering) {
                    if (this.TemplateHookStorage[templateName]) {
                        // TODO: Remove the old dataurl/object association
                        this.TemplateHookStorage[templateName] = null;
                    }
                    this.RegisterTemplate(templateName, jQuerySelector, dataSourceUrls, preRenderingDataProcessor, postRenderingDataProcessor, hiddenElementRendering);
                };

                TemplateModuleManager.prototype.RegisterTemplate = function (templateName, jQuerySelector, dataSourceUrls, preRenderingDataProcessor, postRenderingDataProcessor, hiddenElementRendering) {
                    var _this = this;
                    if (this.TemplateHookStorage[templateName])
                        throw "Template name already registered: " + templateName;
                    this.TemplateHookStorage[templateName] = new TemplateHook(templateName, jQuerySelector, dataSourceUrls.map(function (url) {
                        return _this.InitiateTemplateDataSource(url, templateName);
                    }), preRenderingDataProcessor, postRenderingDataProcessor, hiddenElementRendering);
                };

                TemplateModuleManager.prototype.ActivateTemplate = function (templateName, dataSources, contextPreparer, postRenderingDataProcessor, hiddenElementRendering, selectorString) {
                    this.RefreshTemplate("T:", templateName, dataSources, contextPreparer, postRenderingDataProcessor, hiddenElementRendering, selectorString);
                };

                TemplateModuleManager.prototype.RefreshTemplate = function (currTimestamp, templateName, dataSources, contextPreparer, postRenderingDataProcessor, hiddenElementRendering, selectorString) {
                    var me = this;
                    var promises;
                    var $matchedElements = $(selectorString);
                    var $visibleElements = $matchedElements.filter(":visible");
                    var $hiddenElements = $matchedElements.filter(":hidden");

                    if ($hiddenElements.length > 0) {
                        var $hiddenElementsToUpdate = $hiddenElements.not('[data-oiptimestamp="' + currTimestamp + '"][data-oipvisible="false"]');
                        if ($hiddenElementsToUpdate.length > 0) {
                            hiddenElementRendering(dataSources, $hiddenElementsToUpdate);
                            $hiddenElementsToUpdate.each(function () {
                                var $item = $(this);
                                $item.attr('data-oiptimestamp', currTimestamp);
                                $item.attr('data-oipvisible', 'false');
                            });
                        }
                    }

                    // If no visible, don't do anything
                    if ($visibleElements.length == 0) {
                        //console.log("Nothing visible on template: " + templateName);
                        return;
                    }

                    //console.log("Checking visibility updates: " + templateName);
                    var $visibleToUpdate = $visibleElements.not('[data-oiptimestamp="' + currTimestamp + '"][data-oipvisible="true"]');
                    if ($visibleToUpdate.length == 0) {
                        //console.log("Nothing to update: " + templateName);
                        return;
                    }

                    $visibleToUpdate.each(function () {
                        var $item = $(this);
                        $item.attr('data-oiptimestamp', currTimestamp);
                        $item.attr('data-oipvisible', 'true');
                    });

                    console.log("Promise execution: " + templateName);
                    promises = dataSources.map(function (obj) {
                        return obj.FetchInfo.ExecuteAjaxToPromise();
                    });
                    $.when.apply($, promises).then(function () {
                        console.log("Root object fetch");
                        var dustRootObject = contextPreparer(dataSources);
                        console.log("Rendering dust: " + templateName);
                        dust.render(templateName, dustRootObject, function (error, output) {
                            console.log("Done rendering");
                            console.log(output.substr(0, 20));
                            $visibleToUpdate.each(function () {
                                var $item = $(this);
                                $item.html(output);
                            });
                            if (postRenderingDataProcessor)
                                postRenderingDataProcessor(dataSources, $visibleToUpdate);
                        });
                    });
                };

                TemplateModuleManager.prototype.ActivateNamedTemplates = function (templateNames) {
                    var me = this;
                    for (var i = 0; i < templateNames.length; i++) {
                        var index = templateNames[i];
                        var tHook = this.TemplateHookStorage[index];
                        me.ActivateTemplate(tHook.templateName, tHook.dataSources, tHook.preRenderingDataProcessor, tHook.postRenderingDataProcessor, tHook.hiddenElementRendering, tHook.jQuerySelector);
                    }
                };

                TemplateModuleManager.prototype.RefreshNamedTemplates = function (currTimestamp, templateNames) {
                    var me = this;
                    for (var i = 0; i < templateNames.length; i++) {
                        var index = templateNames[i];
                        var tHook = this.TemplateHookStorage[index];
                        me.RefreshTemplate(currTimestamp, tHook.templateName, tHook.dataSources, tHook.preRenderingDataProcessor, tHook.postRenderingDataProcessor, tHook.hiddenElementRendering, tHook.jQuerySelector);
                    }
                };

                TemplateModuleManager.prototype.ActivateAllTemplates = function () {
                    var me = this;
                    for (var index in this.TemplateHookStorage) {
                        var tHook = this.TemplateHookStorage[index];
                        me.ActivateTemplate(tHook.templateName, tHook.dataSources, tHook.preRenderingDataProcessor, tHook.postRenderingDataProcessor, tHook.hiddenElementRendering, tHook.jQuerySelector);
                    }
                };

                TemplateModuleManager.prototype.RefreshAllTemplateVisibility = function () {
                    var me = this;
                    for (var index in me.TemplateHookStorage) {
                        var tHook = me.TemplateHookStorage[index];
                        var lastTimestamp = "";
                        tHook.dataSources.forEach(function (ds) {
                            if (lastTimestamp < ds.FetchInfo.Timestamp)
                                lastTimestamp = ds.FetchInfo.Timestamp;
                        });
                        me.RefreshTemplate(lastTimestamp, tHook.templateName, tHook.dataSources, tHook.preRenderingDataProcessor, tHook.postRenderingDataProcessor, tHook.hiddenElementRendering, tHook.jQuerySelector);
                    }
                };
                return TemplateModuleManager;
            })();
            UI.TemplateModuleManager = TemplateModuleManager;
        })(Interface.UI || (Interface.UI = {}));
        var UI = Interface.UI;
    })(TheBall.Interface || (TheBall.Interface = {}));
    var Interface = TheBall.Interface;
})(TheBall || (TheBall = {}));

/**
 * Created by kalle on 12.5.2014.
 */
/// <reference path="jquery.d.ts" />
var TheBall;
(function (TheBall) {
    var Interface;
    (function (Interface) {
        var UI;
        (function (UI) {
            var ResourceLocatedObject = (function () {
                function ResourceLocatedObject(isJSONUrl, urlKey, constructData, onUpdate, boundToElements, boundToObjects, dataSourceObjects) {
                    this.isJSONUrl = isJSONUrl;
                    this.urlKey = urlKey;
                    this.constructData = constructData;
                    this.onUpdate = onUpdate;
                    this.boundToElements = boundToElements;
                    this.boundToObjects = boundToObjects;
                    this.dataSourceObjects = dataSourceObjects;
                    // Initialize to empty arrays if not given
                    this.onUpdate = onUpdate || [];
                    this.boundToElements = boundToElements || [];
                    this.boundToObjects = boundToObjects || [];
                    this.dataSourceObjects = dataSourceObjects || [];
                }
                return ResourceLocatedObject;
            })();
            UI.ResourceLocatedObject = ResourceLocatedObject;
            var UpdatingDataGetter = (function () {
                function UpdatingDataGetter() {
                    this.TrackedURLDictionary = {};
                }
                UpdatingDataGetter.prototype.registerSourceUrls = function (sourceUrls) {
                    var _this = this;
                    sourceUrls.forEach(function (sourceUrl) {
                        if (!_this.TrackedURLDictionary[sourceUrl]) {
                            var sourceIsJson = _this.isJSONUrl(sourceUrl);
                            if (!sourceIsJson)
                                throw "Local source URL needs to be defined before using as source";
                            var source = new ResourceLocatedObject(sourceIsJson, sourceUrl, null);
                            _this.TrackedURLDictionary[sourceUrl] = source;
                        }
                    });
                };
                UpdatingDataGetter.prototype.isJSONUrl = function (url) {
                    return url.indexOf("/") != -1;
                };
                UpdatingDataGetter.prototype.getOrRegisterUrl = function (url) {
                    var rlObj = this.TrackedURLDictionary[url];
                    if (!rlObj) {
                        var sourceIsJson = this.isJSONUrl(url);
                        rlObj = new ResourceLocatedObject(sourceIsJson, url, null);
                        this.TrackedURLDictionary[url] = rlObj;
                    }
                    return rlObj;
                };
                UpdatingDataGetter.prototype.RegisterAndBindDataToElements = function (boundToElements, url, onUpdate, sourceUrls) {
                    var _this = this;
                    if (sourceUrls)
                        this.registerSourceUrls(sourceUrls);
                    var rlObj = this.getOrRegisterUrl(url);
                    if (sourceUrls) {
                        rlObj.dataSourceObjects = sourceUrls.map(function (sourceUrl) {
                            return _this.TrackedURLDictionary[sourceUrl];
                        });
                    }
                };
                UpdatingDataGetter.prototype.RegisterDataURL = function (url, onConstruct, sourceUrls) {
                    var me = this;
                    var rlObj = me.getOrRegisterUrl(url);
                    rlObj.constructData = onConstruct;
                    if (sourceUrls) {
                        me.registerSourceUrls(sourceUrls);
                        rlObj.dataSourceObjects = sourceUrls.map(function (sourceUrl) {
                            return me.getOrRegisterUrl(sourceUrl);
                        });
                    }
                    return rlObj;
                };
                UpdatingDataGetter.prototype.UnregisterDataUrl = function (url) {
                    if (this.TrackedURLDictionary[url])
                        delete this.TrackedURLDictionary[url];
                };
                UpdatingDataGetter.prototype.GetData = function (url, callback) {
                    var rlObj = this.TrackedURLDictionary[url];
                    if (!rlObj)
                        throw "Data URL needs to be registered before GetData: " + url;
                    if (rlObj.isJSONUrl) {
                        $.getJSON(url, function (content) {
                            callback(content);
                        });
                    }
                    else {
                        var prom = this.getDataPromise(url);
                        $.when(prom).then(function (content) {
                            return callback(content);
                        });
                    }
                };
                UpdatingDataGetter.prototype.getDataPromise = function (url) {
                    var me = this;
                    var rlObj = this.TrackedURLDictionary[url];
                    if (!rlObj)
                        throw "Data URL needs to be registered before getDataPromise: " + url;
                    var result;
                    if (rlObj.isJSONUrl) {
                        result = $.ajax({ url: url });
                    }
                    else {
                        var promises = rlObj.dataSourceObjects.map(function (dsObj) {
                            return me.getDataPromise(dsObj.urlKey);
                        });
                        result = $.Deferred();
                        $.when.apply($, promises).then(function () {
                            var args = arguments;
                            var value = rlObj.constructData(args);
                            return result.resolve(value);
                        });
                    }
                    return result;
                };
                return UpdatingDataGetter;
            })();
            UI.UpdatingDataGetter = UpdatingDataGetter;
        })(UI = Interface.UI || (Interface.UI = {}));
    })(Interface = TheBall.Interface || (TheBall.Interface = {}));
})(TheBall || (TheBall = {}));
