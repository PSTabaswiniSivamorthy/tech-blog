import React from "react";
import PostAuthor from "../components/PostAuthor";
import { Link } from "react-router-dom";
import Thumbnail from "../images/blog24.jpg";

const PostDetail = () => {
  return (
    <section className="post-detail">
      <div className="container post-detail__container">
        <div className="post-detail__header">
          <PostAuthor />
          <div className="post-detail__ buttons">
            <Link to={`/posts/werwer/edit`} className="btn sm primary">
              Edit
            </Link>
            <Link to={`posts/werwer/delete`} className="btn sm danger">
              Delete
            </Link>
          </div>
        </div>
        <h1>This is the post title</h1>
        <div className="post-detail__thumbnail">
          <img src={Thumbnail} alt=""></img>
        </div>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aut expedita
          fugit ipsum amet sapiente dolore autem illum quo delectus
          consequuntur. Hic ipsum ad aut repudiandae totam modi porro, nobis
          pariatur.
        </p>
        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Et labore
          tempore sint dicta! Esse repellendus voluptates quidem quaerat tempora
          tenetur sequi amet incidunt similique. Culpa eaque consectetur
          sapiente rerum quae, voluptatibus, mollitia odio optio fugiat
          architecto vitae aperiam dolorem neque cupiditate labore consequatur
          porro est omnis?
        </p>
        <p>
          Quam praesentium ut dolore! Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Iusto, repellat. Perspiciatis odit culpa dolorem.
          Vel eius sit, incidunt eaque corporis totam optio dolore quo hic ipsum
          commodi fugit nisi tenetur perspiciatis quasi deleniti itaque
          molestias, quibusdam, repudiandae laborum eum quisquam! Veniam iusto
          fugit in nostrum sed hic dolorem animi! Molestiae, ut eius.
          Asperiores, adipisci, ex numquam quasi tempora repellendus,
          reprehenderit facilis tempore magni minus accusantium quam molestias
          deleniti necessitatibu Iusto voluptas voluptatum, reiciendis ducimus
          quos repellendus suscipit possimus recusandae fugit modi neque sit qui
          illo incidunt molestias a labore tempore dolores facilis quidem
          deleniti quas cupiditate animi. Facilis, quos nobis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium,
          quam fuga. Impedit sequi magnam asperiores laboriosam? Pariatur illum
          provident quas sunt explicabo quos magni corrupti?Lorem, ipsum dolor
          sit amet consectetur adipisicing elit. Quidem, perspiciatis.
          Reprehenderit laborum blanditiis eos maiores fuga illo et omnis
          delectus!
        </p>
        <p>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Officiis,
          repudiandae aut cumque amet dicta earum excepturi tempore quo
          architecto esse incidunt, dolore, nemo quaerat voluptates?
        </p>
      </div>
    </section>
  );
};

export default PostDetail;
