const Head = async () => {
  const response = await fetch("/api/home", {
    headers: { "Accept-Language": "en-CA" },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message);
  }
  return <title>{data.strings["applicationTitle"]}</title>;
};

export default Head;
