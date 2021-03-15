import React, { useState, useRef, useLayoutEffect } from "react";
import { Container, Row, Col } from "../../components/Grid";
import { InputText, FormBtn, InputCheckbox } from "../../components/Form";
import API from "../../utils/API";
import lastFMAPI from "../../utils/lastFMAPI";
import Header from "../../components/Header";
import googleBadge from "../../images/googleplaybadge.png";
import appleBadge from "../../images/badge-download-on-the-app-store.svg";
import StripeCheckout from 'react-stripe-checkout';
import Stripe from '../../utils/stripe';
import EventPic from '../../images/st pattys day.jpg'
import './styles.css'

function RequestPage() {
  // For form
  const [formObject, setFormObject] = useState({
    fullName: "",
    title: "",
    artist: ""
  });

  // For radio buttons
  const [ general, setGeneral ] = useState(false)
  const [ playNow, setPlayNow ] = useState(false)

  // For djId
  const [ djId, setDjId ] = useState("")

  // For AlbumCover
  const [ albumCover, setAlbumCover ] = useState("");

  // For Stripe
  const [product, setProduct] = useState({
    name: "",
    price: 0,
    description: "Song Request"
  });

  // When page is opened for first time, will do nothing.  After, when general/playNow are changed, Stripe Checkout will be triggered (this is only changed when the user submits the form).
  const firstUpdate = useRef(true);
  useLayoutEffect(() => {
    if (firstUpdate.current) {
      getDJId();
      firstUpdate.current = false;
    } else {
      document.querySelector(".StripeCheckout").click();
    }
  }, [general, playNow])

  // Parse URL for djId
  function getDJId() {
    const url = window.location.href;
    var djId = url.substring(url.lastIndexOf("/") + 1)
    setDjId(djId);
    return djId
  }

  // Handles updating component state when the user types into the input field
  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormObject({ ...formObject, [name]: value });
  }

  // When user clicks on "Pay Now"
  function handleFormSubmit(event) {
    event.preventDefault();
    // Sets product for stripe
    setProduct({
      name: formObject.title + ", " + formObject.artist,
      price: formObject.tip
    });
    // To album cover function
    getAlbumCover(formObject.title, formObject.artist);
  }

  // Saves album cover, then changes general or playNow state
  function getAlbumCover(title, artist) {
    lastFMAPI.findAlbumCover(title, artist)
    .then(res => {
        if (document.getElementById("generalRequest").checked === true) {
          if (res.data.message !== "Track not found" && res.data.track.album) {
            let image = res.data.track.album.image[2]["#text"];
            setAlbumCover(image);
          } else if (albumCover === "") {
            setAlbumCover("https://res.cloudinary.com/noimgmt/image/upload/v1615592263/noireqapp/njitt7mzvpuidhjila9m.jpg")
          }
          setGeneral(true)
        } else {
          if (res.data.message !== "Track not found" && res.data.track.album) {
            let image = res.data.track.album.image[2]["#text"];
            setAlbumCover(image);
          } else if (albumCover === "") {
            setAlbumCover("https://res.cloudinary.com/noimgmt/image/upload/v1615592288/noireqapp/eklx5ftujcwbrddrovyi.jpg")
          }
          setPlayNow(true)
        };
    });
  }

  // Stripe checkout;  On success, goes to addToDatabase function
  async function handleToken(token, addresses) {
    const response = await Stripe.checkout(token, product);

    const { status } = response.data
    if (status === 'success') {
      addToDatabase();
    } else {
      console.log("Payment not successful");
    }
  }

  // Will post to database once payment is successful; then re-directs to the confirmation page
  function addToDatabase() {

    switch (general) {
      case true:
        var requestSongStatus = "generalRequestQueue";
        break;
      case false:
        requestSongStatus = "playNowQueue";
        break;
      default:
        console.log("It didn't work. Fix it!")
        break;
    }

    API.createRequest({
      albumCover: albumCover,
      tip: formObject.tip,
      fullName: formObject.fullName,
      title: formObject.title,
      artist: formObject.artist,
      generalRequest: general,
      playNow: playNow,
      songStatus: requestSongStatus,
      _id: djId
    })
      .then(res => {
        console.log(djId);
        window.location.replace(`/request/confirmation/${djId}`);
      })
      .catch(err => console.log(err))
  }

  return (
    <div className="request-page">
      <Header title="welcome customer" />
      <Container classes="top-container">
        <h1 className="request-title">SEND A REQUEST</h1>
        <form>
          <Row>
            <Col>
            <img src={EventPic} alt={"appleBadge"} className="eventPic"></img>
              {/* <i className="far fa-image fa-10x" stlye={{color: "white", backgroundColor: "white"}}></i> */}
            <p className="h6 ml-2">Doesn't look familiar?  Click <a href="/request">here</a> to find your DJ!</p>
            </Col>
            <Col>
              <InputText
                onChange={handleInputChange}
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Your name here"
                label="Your name:"
                className="form-control"
              />
              <InputText
                onChange={handleInputChange}
                type="text"
                id="title"
                name="title"
                placeholder="Song title"
                label="Title:"
                className="form-control"
              />
              <InputText
                onChange={handleInputChange}
                type="text"
                id="artist"
                name="artist"
                placeholder="Artist"
                label="Artist:"
                className="form-control"
              />
            </Col>
          </Row>
          <br />
          <Row>
            <Col size="md-3 sm-12">
            <InputCheckbox
              onChange={handleInputChange}
              type="radio"
              name="requestType"
              value="2"
              id="generalRequest" 
              label="General"
              className="form-check-input"
              tooltipTitle="A request will be sent to the DJ.  The DJ will review these after the Play Now requests."
              />
            </Col>
            <Col size="md-9 sm-12">
              <p className="ml-3">Minimum tip: $2</p>
            </Col>
          </Row>
          <Row>
            <Col size="md-3 sm-12">
            <InputCheckbox
              onChange={handleInputChange}
              type="radio"
              name="requestType"
              value="100"
              id="playNow" 
              label="Play Now"
              className="form-check-input"
              tooltipTitle="The DJ will see these requests immediately."
              />
            </Col>
            <Col size="md-9 sm-12">
              <p className="ml-3">Minimum tip: $100</p>
            </Col>
          </Row>
          <Row>
            <Col>
          <InputText
            onChange={handleInputChange}
            type="number"
            id="tip"
            name="tip"
            placeholder="Tip Amount in $"
            className="form-control"
          />
          </Col>
          </Row>
            <FormBtn className="btn btn-dark btn-lg mb-3" onClick={handleFormSubmit}>
              Pay Now!
            </FormBtn>
        </form>
        <div className="hidden">
          <StripeCheckout 
              stripeKey="pk_test_51IUJhcHM5nnUsQBqrf1yVa2R6C7BhNjV6uLVJVkJUmZyYDkaOv5RAAq7N7JwmZr9cmwpwBbRF0achPVIO8lybn8p002lQBMQ2L"
              token={handleToken}
              billingAddress
              shippingAddress
              amount={product.price * 100}
              name={product.name}
          />
        </div>
        <div className="text-center">
          <img src={appleBadge} alt={"appleBadge"} className="mr-3 mt-2"></img>
          <img src={googleBadge} alt={"googleBadge"} style={{width: ""}} className="mt-2"></img>
        </div>
      </Container>
    </div>
  );
}

export default RequestPage;
