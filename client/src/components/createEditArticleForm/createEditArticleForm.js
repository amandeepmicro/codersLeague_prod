import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Link } from "react-router-dom";
import { Form, Message, Button, Icon } from "semantic-ui-react";
import { useForm, Controller } from "react-hook-form";

import ReactQuill, { Quill } from "react-quill";
import ImageUploader from "quill-image-uploader";

import { postArticleService, updateArticleService } from "./../../services/articleApi";

import { tagOptions, expertiseOptions } from "./../../common/dropdownOptions";
import formStyle from "./../../common/formStyles";

import "./../../quill.css";
import "./createEditArticleForm.css";

const icons = Quill.import("ui/icons");
icons["code-block"] =
  '<svg viewbox="0 -2 15 18"><polyline class="ql-even ql-stroke" points="2.48 2.48 1 3.96 2.48 5.45"/><polyline class="ql-even ql-stroke" points="8.41 2.48 9.9 3.96 8.41 5.45"/><line class="ql-stroke" x1="6.19" y1="1" x2="4.71" y2="6.93"/><polyline class="ql-stroke" points="12.84 3 14 3 14 13 2 13 2 8.43"/></svg>';

Quill.register({ "modules/imageUploader": ImageUploader }, true);

const CreateEditArticleForm = forwardRef(({ currentUser, articleData = null }, ref) => {
  // console.log('rendered')
  // console.log(articleData)
  const defaultValues = {
    image: (articleData && articleData.image) || "",
    file: null,
    title: (articleData && articleData.title) || "",
    expertiseLevel: (articleData && articleData.expertiseLevel) || "",
    tags: (articleData && articleData.tags) || [],
    shortDescription: (articleData && articleData.shortDescription) || "",
    body: (articleData && articleData.body) || "<p>Add some content...</p>",
  };

  const getArticleData = () => {
    return getValues();
  };
  useImperativeHandle(ref, () => ({
    getArticleData: getArticleData,
  }));

  // const quillRef = React.useRef(null);
  const { register, unregister, handleSubmit, errors, getValues, control, setValue, trigger, reset, watch } = useForm({
    mode: "onChange",
    defaultValues,
  });

  const coverImageValue = watch("file");
  const expertiseValue = watch("expertiseLevel");
  const tagsValue = watch("tags");

  const [status, setStatus] = useState({
    statusCode: null,
    isUploading: false,
    isUploadingCover: false,
    errors: false,
    successMessage: null,
    visibleMessage: false,
  });
  const baseState = {
    statusCode: null,
    isUploading: false,
    isUploadingCover: false,
    errors: false,
    successMessage: null,
    visibleMessage: false,
  };
  useEffect(() => {
    register({ name: "expertiseLevel" }, { required: "Article must have an expertise level." });
    register(
      { name: "tags" },
      {
        validate: (value) => {
          return (
            (1 <= value.length && value.length < 5) || "You must add at least 1 tag and at most 4 tags in a article."
          );
        },
      }
    );

    // console.log('rendered in use effect')
    return () => {
      unregister("expertiseLevel");
      unregister("tags");
      unregister("body");
    };
  }, [register, unregister]);

  const handleCoverImageUpload = () => {
    const image = getValues("file")[0];
    // console.log(image)
    if (!image) {
      return;
    }
    setStatus({ ...status, isUploadingCover: true });

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "article_images");
    fetch("https://api.cloudinary.com/v1_1/dryiuvv1l/image/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong with uploading image!");
        }
      })
      .then((result) => {
        //console.log(result);
        setValue("image", result.secure_url);

        setStatus({ ...baseState, isUploadingCover: false });
      })
      .catch((error) => {
        console.error("Error:", error);
        setStatus({ ...baseState, isUploadingCover: false, errors: error });
      });
  };
  const handleCoverImageDelete = () => {
    // can also delete image from database with the delete url from ibb
    [
      { name: "image", value: "" },
      { name: "file", value: null },
    ].forEach(({ name, value }) => setValue(name, value));
  };

  const onSubmit = async ({ file, ...data }) => {
    // console.log(data)
    try {
      setStatus({ ...baseState, isUploading: true });
      let response;
      if (articleData !== null) {
        response = await updateArticleService(articleData.id, data);
      } else {
        response = await postArticleService(data);
      }

      // console.log(response.data)
      setStatus({
        ...baseState,
        statusCode: response.status,
        visibleMessage: true,
        successMessage: `/u/${currentUser.username}/a/${response.data.data.slug}`,
        isUploading: false,
      });
    } catch (error) {
      const { response } = error;
      const { request, ...errorObject } = response;
      setStatus({
        ...baseState,
        statusCode: errorObject.status,
        isUploading: false,
        errors: errorObject.data.message,
        visibleMessage: true,
      });
    }
  };
  const handleDismiss = () => {
    setStatus({ ...status, visibleMessage: false });
  };

  const handleChange = async (e, { name, value }) => {
    // console.log(name, value)
    setValue(name, value);
    await trigger(name);
  };

  const editorFormats = [
    "header",
    "font",
    "background",
    "color",
    "code",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "script",
    "align",
    "direction",
    "link",
    "image",
    "imageBlot",
    "code-block",
    "formula",
    "video",
  ];
  const editorModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }, "bold", "italic", "underline"],
          ["blockquote", "code", "code-block"],
          [{ align: [] }, { list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          // removed 'video' due to helmet & mobile view issues
        ],
      },
      imageUploader: {
        upload: (file) => {
          return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "article_images");
            fetch("https://api.cloudinary.com/v1_1/dryiuvv1l/image/upload", {
              method: "POST",
              body: formData,
            })
              .then((response) => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error("Something went wrong with uploading image!");
                }
              })
              .then((result) => {
                //console.log(result);
                resolve(result.secure_url);
              })
              .catch((error) => {
                reject("Upload failed");
                console.error("Error:", error);
              });
          });
        },
      },
    }),
    []
  );

  return (
    <Form
      style={formStyle.align}
      onSubmit={handleSubmit(onSubmit)}
      error={!!status.errors}
      success={status.statusCode === 200 ? true : false}
    >
      <Form.Field error={!!errors.file}>
        <label htmlFor="coverImage">Cover Image</label>
        <div>
          <input
            type="file"
            name="file"
            id="coverImage"
            accept="image/*"
            ref={register({
              validate: {
                checkSize: (value) => {
                  if (value[0]) {
                    return value[0].size < 5242880 || "Only Image upto the size of 5MB is allowed!";
                  }
                  return;
                },
                checkType: (value) => {
                  if (value[0]) {
                    return value[0].type.startsWith("image") || "Not an image! Please upload only images.";
                  }
                  return;
                },
              },
            })}
          />
        </div>
        {errors.file && <span style={formStyle.errorMessage}>{errors.file.message}</span>}

        {!errors.file && coverImageValue && coverImageValue.length > 0 && (
          <div>
            <Button.Group
              widths="2"
              size="small"
            >
              <Button
                onClick={() => handleCoverImageUpload()}
                loading={status.isUploadingCover}
                type="button"
                positive
              >
                Upload
              </Button>
              {getValues("image") && (
                <Button
                  onClick={() => handleCoverImageDelete()}
                  type="button"
                  negative
                >
                  Delete
                </Button>
              )}
            </Button.Group>
          </div>
        )}
      </Form.Field>
      <Form.Field
        error={!!errors.image}
        disabled
      >
        <label htmlFor="imageURL">Cover Image URL</label>
        <input
          id="imageURL"
          placeholder="Upload to get URL of cover image."
          type="text"
          name="image"
          readOnly
          ref={register()}
        />
      </Form.Field>
      <Form.Field error={!!errors.title}>
        <label htmlFor="title">Title</label>
        <div className="ui input">
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Article Title here..."
            ref={register({
              required: "You must specify a title.",
              minLength: {
                value: 7,
                message: "Title must have at least 7 characters.",
              },
              maxLength: {
                value: 250,
                message: "Title must have at most 250 characters.",
              },
            })}
          />
        </div>
        {errors.title && <span style={formStyle.errorMessage}>{errors.title.message}</span>}
      </Form.Field>
      <Form.Field error={!!errors.expertiseLevel}>
        <Form.Dropdown
          value={expertiseValue}
          name="expertiseLevel"
          label="Expertise Level"
          options={expertiseOptions}
          placeholder="Choose a Expertise Level"
          onChange={(e, name, value) => handleChange(e, name, value)}
          error={errors.expertiseLevel ? true : false}
          fluid
          selection
          lazyLoad={true}
        />
        {errors.expertiseLevel && <span style={formStyle.errorMessage}>{errors.expertiseLevel.message}</span>}
      </Form.Field>
      <Form.Field error={!!errors.tags}>
        <Form.Dropdown
          value={tagsValue}
          name="tags"
          label={{ children: "Tags", htmlFor: "form-select-tags" }}
          options={tagOptions}
          placeholder="Search and Add tags"
          searchInput={{ id: "form-select-tags" }}
          onChange={(e, name, value) => handleChange(e, name, value)}
          error={errors.tags ? true : false}
          multiple
          search
          selection
          fluid
          lazyLoad={true}
        />
        {errors.tags && <span style={formStyle.errorMessage}>{errors.tags.message}</span>}
      </Form.Field>
      <Form.Field error={!!errors.shortDescription}>
        <label htmlFor="shortDescription">Short Description</label>
        <textarea
          id="shortDescription"
          placeholder="Some short description..."
          name="shortDescription"
          ref={register()}
          rows="3"
        />
        {errors.shortDescription && <span style={formStyle.errorMessage}>{errors.shortDescription.message}</span>}
      </Form.Field>

      {/* body */}
      <Form.Field error={!!errors.body}>
        <label htmlFor="body">Article Body</label>

        <Controller
          control={control}
          name="body"
          rules={{
            required: "Article must have some content.",
            validate: (value) => {
              return value.split(" ").length > 10 || "Enter at least 10 words in the body.";
            },
          }}
          render={({ onChange, onBlur, value, name, ref }, { invalid, isTouched, isDirty }) => (
            <ReactQuill
              // ref={quillRef}
              // defaultValue={value} fix error https://github.com/quilljs/quill/issues/1940#issuecomment-379536850
              onChange={onChange}
              value={value}
              inputRef={ref}
              theme="snow"
              formats={editorFormats}
              modules={editorModules}
              className={!!errors.body ? "quill-error" : ""}
              placeholder="Write your article content here..."
              id="body"
            />
          )}
        />
        {errors.body && <span style={formStyle.errorMessage}>{errors.body.message}</span>}
      </Form.Field>

      {status.visibleMessage && (
        <Message
          error={!!status.errors}
          success={status.statusCode === 200 ? true : false}
          onDismiss={handleDismiss}
          icon
        >
          <Icon name="bullhorn" />
          <Message.Content>
            <Message.Header>{status.errors ? "Error" : "Success"}</Message.Header>
            {status.errors ? status.errors : <Link to={status.successMessage}>Published 🚀. Click to visit it.</Link>}
          </Message.Content>
        </Message>
      )}
      <Form.Button
        type="submit"
        style={formStyle.formButton}
        color="blue"
        content="Publish"
        loading={status.isUploading ? true : false}
        fluid
      />
      <button
        className="ui fluid button"
        type="button"
        onClick={() => reset()}
      >
        Reset
      </button>
      {/* <button className="ui fluid button secondary" type="button" onClick={() => console.log(getValues())}>getdata</button> */}
    </Form>
  );
});

export default CreateEditArticleForm;
