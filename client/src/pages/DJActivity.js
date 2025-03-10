import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "../components/Grid";
import ActivityRow from "../components/ActivityRow";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth0 } from "@auth0/auth0-react";
import checkIfProfileExists from "../utils/checkProfileCreated";
import API from "../utils/API";

function DJActivity() {

    const { user } = useAuth0();

    // Global variable to send newly acquired activated eventId (via the getActivatedEvent API) to the 
    // getSongStatusCount API function (it follows the getActivatedEvent API in the loadActivatedEventRequests function).
    // Have to do it this way because of the way seting a state works in the loadActivatedEventRequests function.
    // We set the activatedEventId in the loadActivatedEventRequests function via the getActivatedEvent API but it isn't 
    // immediately available for the getSongStatusCount API function.
    // Working around until a better way is figured out.
    var eventIdForSongCount;

    // Set state djActivatedDjId to the logged in Dj's ObjectId

    // Set state activatedEventId to the activated event._id
    // This will be sent to the PUT API call to update requestList for song that was moved.
    //const [activatedEventId, setActivatedEventId] = useState("");

    // Set state of activity to the requestList array of song request objects attached to the activated event.
    const [activity, setActivity] = useState([]);

    // Set states for the numbers of song requests on the request page for the queue, playNowQueue, and the generalRequestQueue.
    const [queueCount, setQueueCount] = useState("0");
    const [playNowQueueCount, setPlayNowQueueCount] = useState("0");
    const [generalRequestCount, setGeneralRequestQueueCount] = useState("0");


    useEffect(() => {
        checkIfProfileExists(user.sub);
        // If the Dj has a profile already (they exist) this loads dj profile and active event for the queue
        loadProfile(user.sub);
    }, [user.sub])

    // Get the Dj profile
    // Send their djId to loadActivatedEvent to get the activated event._id
    // Technically this only has to be done on load, as the event._id is attached to the Dj already/
    // function loadProfile(id) {
    const loadProfile = id => {
        API.getDj(id)
            .then(res => {
                loadActivatedEventRequests(res.data[0]._id)
            })
            .catch(err => console.log(err))
    }

    // Use the activatedDjId to access the associated events document in the Dj Document.
    // The API.getActivatedEvent call will use the activatedDjId to get the one and only activated
    // event._id in the Dj's event list. Once the res is returned we can set the activity list to the 
    // requestList (an array of songs with their statuses) in the event document.
    // Once the intial load is done it will call the loadRequests function.
    // This will be accessed on the initial load and any time there after when the requestList changes.
    // Once the intial load is done it will call the loadRequests function.
    async function loadActivatedEventRequests(djId) {
        await API.getActivatedEvent(djId)
            .then(res => {

                // Set setActivatedEventId to the Event._id for the one and only activated event in the Dj document.
                // setActivatedEventId(res.data.events[0]._id);
                // A Dj can only have one activated event at a time.
                setActivity(res.data.events[0].requestList);

                // eventIdForSongCount is assign the activated eventId so it can access it immediately below in getSongStatusCount API.
                eventIdForSongCount = res.data.events[0]._id;

            })
            .catch(err => console.log(err));

        // API to retrieve occurrences (count) of the songs in the queue, playNowQueue, and the generalRequestQueue.
        // Send it the actived eventId via the global variable eventIdForSongCount that is assigned above via the 
        // getActivatedEvent API. I wanted to just send it the activatedEvent state, but it was available yet - as it was just set.
        await API.getSongStatusCount(eventIdForSongCount)
            .then(res => {

                // The way the aggreagate method for mongodb wasn't working correctly. 
                // Declare counters here for the occurrences of queue, playNowQueue, and generalRequestQueue 
                // That are in the returned array from the API. It should have returned the count of each for us, but
                // there is a glitch. This is the workout, take the array and count them ourselves.
                var queueCounter = 0;
                var playNowQueueCounter = 0;
                var generalRequestQueueCounter = 0;

                // Go through the array of songStatuses and increased appropriate counter.
                for (var i = 0; i < res.data[0]._id.length; i++) {
                    if (res.data[0]._id[i] === "queue") {
                        queueCounter = queueCounter + 1;
                    }
                    else if (res.data[0]._id[i] === "playNowQueue") {
                        playNowQueueCounter = playNowQueueCounter + 1;
                    }
                    else if (res.data[0]._id[i] === "generalRequestQueue") {
                        generalRequestQueueCounter = generalRequestQueueCounter + 1;
                    }
                }

                // Set the states for the queue, playNowQueue, and generalRequestQueue counters.
                // They are displayed on the request page for the different queues.
                setQueueCount(queueCounter)
                setPlayNowQueueCount(playNowQueueCounter)
                setGeneralRequestQueueCount(generalRequestQueueCounter)
            })
            .catch(err => console.log(err));
    }

    return (
        <div>
            <Header title="ACTIVITY" />
            <Container classes="top-container bottom-container text-center">
                <Row classes="p-4 mt-0 activity-header-bottom">
                    <Col size="4"><h3 className="text-muted">Queue: <span className="badge badge-light"> {queueCount}</span></h3></Col>
                    <Col size="4"><h3 className="text-muted">Play Now: <span className="badge badge-light"> {playNowQueueCount}</span></h3></Col>
                    <Col size="4"><h3 className="text-muted">General: <span className="badge badge-light"> {generalRequestCount}</span></h3></Col>
                </Row>
                <Row classes="pt-0 mt-0 activity-header-bottom ">
                    <Col size="4"><h5 className="text-warning">SONG</h5></Col>
                    <Col size="3"><h5 className="text-warning">STATUS</h5></Col>
                    <Col size="2"><h5 className="text-warning">TIPPED</h5></Col>
                    <Col size="3"><h5 className="text-warning">GUEST</h5><p className="text-warning">(REQUEST TYPE)</p></Col>
                    {/* <Col size="3"><h5 className="text-warning">SUBMITTED / UPDATED</h5></Col> */}
                </Row>
                {/* .map to activity list */}
                {/* props: key, id, title, artist, tip, guestName, timeStamp*/}
                {activity.map(requestHistory => (
                    <ActivityRow
                        key={requestHistory._id}
                        {...requestHistory}
                    />
                ))}
            </Container>
            <Footer current="activity" />
        </div>
    )
}

export default DJActivity;