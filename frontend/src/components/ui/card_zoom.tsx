import React from "react";
import styled from "styled-components";

interface CardProps {
  name: string;
  category: string;
  price?: string;
  logo: string;
}

const Card: React.FC<CardProps> = ({ name, category, price, logo }) => {
  return (
    <StyledWrapper>
      <div className="card">
        <img src={logo} alt={name} className="img" />
        <div className="textBox">
          <p className="text head">{name}</p>
          <span>{category}</span>
          {price && <p className="text price">{price}</p>}
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    overflow: hidden;
    position: relative;
    width: 195px;
    height: 285px;
    background: #313131;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    transition: 0.2s ease-in-out;
  }

  .img {
    height: 30%;
    width: auto;
    object-fit: contain;
    position: absolute;
    transition: 0.2s ease-in-out;
    z-index: 1;
    pointer-events: none;
  }

  .textBox {
    opacity: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    transition: 0.2s ease-in-out;
    z-index: 2;
    text-align: center;
    // padding: 10px;
  }

  .textBox > .text {
    font-weight: bold;
  }

  .textBox > .head {
    font-size: 20px;
  }

  .textBox > .price {
    font-size: 17px;
  }

  .textBox > span {
    font-size: 12px;
    color: lightgrey;
  }

  .card:hover > .textBox {
    opacity: 1;
  }

  .card:hover > .img {
    height: 65%;
    filter: blur(7px);
    animation: anim 3s infinite;
  }

  @keyframes anim {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
    100% {
      transform: translateY(0);
    }
  }

  .card:hover {
    transform: scale(1.04) rotate(-1deg);
  }
`;

export default Card;
