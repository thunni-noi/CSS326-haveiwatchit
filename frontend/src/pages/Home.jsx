import { Link } from "react-router-dom";
import HomeContent from "../components/HomeComponents/HomeContents";

const Home = ({user, error}) => {
    return (
    <>
    <main>
        <HomeContent />
    </main>
    </>
    )
}

export default Home;