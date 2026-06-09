import React from "react";
import { useParams } from "react-router-dom";
import ProfilKart from "../../components/ProfilKart";

export default function KamyoncuProfil() {
  const { userId } = useParams();

  return <ProfilKart rol="kamyoncu" userId={userId} />;
}
