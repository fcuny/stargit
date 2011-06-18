package StarGit;
use Dancer ':syntax';

use StarGit::Graph;
use StarGit::Info;
use Dancer::Plugin::Redis;

our $VERSION = '0.1';

set serializer => 'JSON';

get '/' => sub {
    template 'index';
};

get '/graph/local/:name' => sub {
    my $name = params->{'name'};

    if (my $cached_graph = redis->get($name)){
        debug("cache hit for $name");
        return $cached_graph;
    }
    
    my $graph =
      StarGit::Graph->new( name => $name, mongodb_auth => setting('mongodb') );

    return send_error( "user " . $name . " doesn't exists", 404 )
      unless $graph->exists($name);

    $graph->neighbors( $name, 1 );
    $graph->remove_leaves();

    my $serialized_graph = to_json(_finalize($graph));
    redis->set($name, $serialized_graph);
    return $serialized_graph;
};

get '/graph/attributes' => sub {
    my $graph_settings = setting('graph');
    my $attributes     = $graph_settings->{attributes};
    return { attributes => $attributes };
};

get '/profile/:login' => sub {
    my $login = params->{login};
    my $info = StarGit::Info->new( login => $login )->get();

    if ( !defined $info ) {
        return send_error( "no information for profile " . $login );
    }

    return $info;
};

sub _finalize {
    my $graph = shift;

    my @nodes = values %{ $graph->nodes };
    my @edges = values %{ $graph->edges };

    return { nodes => \@nodes, edges => \@edges, };
}

true;
