// Example usage:
//
// new Key()
// new Key(priv)
// new Key(null, pub)

var Key = function(priv, pub) {
  this.setPriv(priv);
  this.setPub(pub);
};

export default Key;
